 
 const { log, biglog, errorlog, colorize}= require("./out");
 const model = require('./model');
 
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
	model.getAll().forEach((quiz,id)=>{
		log(` [${colorize(id,'magenta')}]: ${quiz.question}`);
	});

	rl.prompt();
};

//Muestra el quiz indicando en el parámetro la pregunta y la respuesta
exports.showCmd = (rl, id)=> {
	if (typeof id === "undefined"){
		errorlog(`Falta el parámetro id.`);
	} else {
		try {
			const quiz =model.getByIndex(id);
			log(`[${colorize(id,'magenta')}]): ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
		} catch (error){
			errorlog(error.message);
		}
	}
	rl.prompt();
};

//Añade un nuevo quiz al modelo
exports.addCmd = rl => {
	rl.question(colorize(' Introduzca una pregunta: ', 'red'), question=> {
		rl.question(colorize ('Introduzca la respuesta', 'red'), answer =>{
			model.add(question, answer);
			log(`${colorize('Se ha añadido', 'magenta')}:${question} ${colorize('=>', 'magenta')} ${answer}`);
			rl.prompt();
		});
	});
};

//Borra un quiz modelo.
exports.deleteCmd = (rl, id) => {
	if (typeof id === "undefined"){
		errorlog(`Falta el parámetro id.`);
	} else {
		try {
			model.deleteByIndex(id);
		} catch (error){
			errorlog(error.message);
		}
	}
	rl.prompt();
};

//Edita un quiz modelo.
exports.editCmd = (rl, id) =>{
	if (typeof id === "undefined"){
		errorlog(`Falta el parámetro id.`);
	} else {
		try {
			const quiz = model.getByIndex(id);
			process.stdout.isTTY && setTimeout(()=> {rl.write(quiz.question)},0);


			rl.question(colorize(' Introduzca una pregunta', 'red'), question => {
				process.stdout.isTTY && setTimeout(()=> {rl.write(quiz.question)},0);
				rl.question(colorize(' Introduzca la respuesta', 'red'),answer=>{
					model.update(id,question,answer);
					log(`Se ha cambiado el quiz ${colorize(id, 'magenta')}por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
					rl.prompt();
				});
			});
		} catch (error){
			errorlog(error.message);
			rl.prompt();
		}
	}
};

//Prueba las preguntas y respuestas
exports.testCmd = (rl, id) => {
	
	if (typeof id === "undefined"){
		errorlog(`Falta el parámetro id.`);
	} else {
		try{
			const quiz = model.getByIndex(id);
			
			rl.question(`${colorize(quiz.question, "red")}${colorize('?', 'red')}`, respuesta => {
				log("Su respuesta es:");
				const sinEspacios = respuesta.match(/[a-zñáéíóúA-Z0-9_]+/ig);

				if ( sinEspacios[0].trim().toLowerCase() === quiz.answer.toLowerCase()){
					log("Su respuesta es correcta.");
					
					biglog("Correcta", "green");
					
				}else{
					log("Su respuesta es incorrecta.")
					biglog("Incorrecta", "red");
				};
			rl.prompt();
			});
		}catch(error){
			errorlog(error.message);
			print("Ha habido un error")
			rl.prompt();
		}
	}

};

//Método Jugar
exports.playCmd = rl => {
	let score =0;
	let quizzes = model.getAll();
	let toBeResolved = [];
	for (var i = 0; i< quizzes.length; i++){
		toBeResolved[i]=i;
	}

	const playOne = ()=>{

		if(toBeResolved.length === 0){
            log(`No hay nada más que preguntar.`);
            log(`Fin del juego. Aciertos: ${score}`);
           // log("Fin");
           // log('Tu puntuación es' );
            biglog(score, 'magenta');
            rl.prompt();
		}else{
			let id = Math.floor((Math.random()*toBeResolved.length));
		
			let index = toBeResolved[id];
			toBeResolved.splice(id, 1);
			const quiz = model.getByIndex(index);
			
				rl.question(`${colorize(quiz.question, "red")}${colorize('?', 'red')}`, respuesta => {
					//log("Su respuesta es:");
					//const sinEspacios = respuesta.match(/[a-zñáéíóúA-Z0-9_]+/ig);

					if ( respuesta.trim().toLowerCase() === quiz.answer.toLowerCase()){
					//if ( sinEspacios[0].trim().toLowerCase() === quiz.answer.toLowerCase()){
						//log("Correct");
						//biglog("CORRECTA", "green");
						score=score+1;
						log("Su respuesta es: CORRECTA");
						log(`correcto`);
						log(`CORRECTO - Lleva ${score} aciertos.`);
						//toBeResolved.splice(id, 1);
						playOne();
						
					}else{
						log("Su respuesta es: INCORRECTA");
						log(`incorrecto`);
     	 				log('INCORRECTO.');
						log(`Final del juego. Aciertos: ${score}`);
						biglog(score, 'magenta');
						//log(`Has acertado ${colorize(score, "blue")} preguntas`);
						rl.prompt();
					};
				//rl.prompt();
				});

		}
	};	
	playOne();

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