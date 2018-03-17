 
 const Sequelize = require('sequelize');
 const { log, biglog, errorlog, colorize}= require("./out");
 const {models} = require('./model');
 
 //Muestra ayuda 
exports.helpCmd = rl => {
	log("Comandos:");
	log(" h | help - Muestra esta ayuda.");
	log(" list - Listar los quizzes existentes.");
	log(" show <id> - Muestra la pregunta y la respuesta el quiz indicado.")
	log(" add - Añadir un nuevo quiz interactivamente.");
	log(" delete <id> - Borrar el quiz indicado.");
	log(" edit <id> - Editar el quiz indicado.");
	log(" test <id> - Probar el quiz indicado.");
	log(" p|play -Jugar a preguntar aleatoriamente todos los quizzes.");
	log(" credits - Créditos.");
	log(" q|quit - Salir del programa.");
	rl.prompt();

};

//Lista todos los quizzes existentes en el modelo
exports.listCmd = rl => {
models.quiz.findAll()
.then(quizzes => {
	quizzes.forEach((quiz) => {
		log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
	});
})
.catch(error => {
	errorlog(error.message);
})
.then(() => {
	rl.prompt();
});

};

const validateId = id => {
	return new Sequelize.Promise((resolve, reject) => {
		if (typeof id === "undefined") {
			reject(new Error(`Falta el parámetro <id>.`));
		} else {
			id = parseInt(id);
			if(Number.isNaN(id)) {
				reject(new Error(`El valor del parámetro <id> no es un número.`));
			} else {
				resolve(id);
			}
		}
	});
};

//Muestra el quiz indicando en el parámetro la pregunta y la respuesta
exports.showCmd = (rl, id)=> {
	validateId(id)
		.then(id => models.quiz.findById(id))
		.then(quiz => {
			if(!quiz) {
				throw new Error(`No existe un quiz asociado al id=${id}.` );
			}
			log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
		})
		.catch(error => {
		errorlog(error.message);
		})
		.then(() => {
		rl.prompt();
	});
};

const makeQuestion = (rl, text) => {
	return new Sequelize.Promise((resolve, reject) => {
		rl.question(colorize(text, 'red'), answer => {
			resolve(answer.trim());
		});
	});
};

//Añade un nuevo quiz al modelo
exports.addCmd = rl => {
	makeQuestion(rl, ' Introduzca una pregunta: ')
	.then(q => {
		return makeQuestion(rl, ' Introduzca la respuesta ')
		.then(a => {
			return {question: q, answer: a};
		});
	})
	.then(quiz => {
		return models.quiz.create(quiz);
	})
	.then((quiz) => {
		log(` ${colorize('Se ha añadido', 'magenta')} : ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})		
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

//Borra un quiz modelo.
exports.deleteCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quiz.destroy({where: {id}}))
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

//Edita un quiz modelo.
exports.editCmd = (rl, id) =>{

	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if(!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		
		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
		return makeQuestion(rl, ' Introduzca una pregunta: ')
		.then(q => {
			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
			return makeQuestion(rl, ' Introduzca la respuesta: ')
			.then(a => {
				quiz.question = q;
				quiz.answer = a;
				return quiz;
			});
		});
	})
	.then(quiz => {
		return quiz.save();
	})
	.then((quiz) => {
		log(` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})		
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

//Prueba las preguntas y respuestas
exports.testCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if(!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		return makeQuestion(rl, ` ${quiz.question} `)
		.then(q => {
			if(q.trim().toLowerCase() === quiz.answer.toLowerCase()){
				log("Su respuesta es correcta.");	
				biglog("Correcta", "green");
			}else{
				log("Su respuesta es incorrecta.")
				biglog("Incorrecta", "red");
			}
		});

	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

//Método Jugar
exports.playCmd = rl => {

	let score = 0;
	let toBeResolved = [];

	const play = () => {

		return new Promise((resolve,reject) => {

			if(toBeResolved.length === 0){
	            log(`No hay nada más que preguntar.`);
	            log(` Fin del juego. Aciertos: ${score}`);
	            log("Fin");
	            log(` Tu puntuación es: ${score} ` );
	            biglog(score,'magenta');
				resolve();
			}
			let id = Math.floor(Math.random()*toBeResolved.length);
			makeQuestion(rl,`${toBeResolved[id].question}? `)
			.then(a => {
			if(a.toLowerCase().trim() === toBeResolved[id].answer.toLowerCase().trim()){
					score=score+1;
					toBeResolved.splice(id,1);
					log(` correcto`);
					log("Su respuesta es correcta.");
					log(`Aciertos: ${score}`);	
					biglog("Correcta", "green");
					resolve(play());
				} else {
					toBeResolved.splice(0,toBeResolved.length);	
					log("Su respuesta es incorrecta.")
					biglog("Incorrecta", "red");					
					resolve(play());
				}	
			});

		});

	};
	models.quiz.findAll()
	.then(quizzes => {
		quizzes.forEach((quiz) => {
			toBeResolved.push(quiz);
		});
	})
	.then(() => {
		return play();
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

//Muestra los autores de la práctica
exports.creditsCmd = rl => {
	log('Autores de la práctica: ');
	log('Jorge Tardío Rubio', 'green');
	rl.prompt();
};

//Terminar el programa 
exports.quitCmd = rl=> {
	rl.close();
};

