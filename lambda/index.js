/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const http = require('https');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Olá, o que gostaria de saber sobre a fábrica?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const getHttp = function(url) {
    return new Promise((resolve, reject) => {
        const request = http.get(`${url}`, response => {
            response.setEncoding('utf8');
           
            let returnData = '';
            if (response.statusCode < 200 || response.statusCode >= 300) {
                return reject(new Error(`${response.statusCode}: ${response.req.getHeader('host')} ${response.req.path}`));
            }
           
            response.on('data', chunk => {
                returnData += chunk;
            });
           
            response.on('end', () => {
                resolve(returnData);
            });
           
            response.on('error', error => {
                reject(error);
            });
        });
        request.end();
    });
}

function calculateOLEFactory(data) {
    let ltAcumulado = 0;
    let rtAcumulado = 0;
    
    for(let i = 0; i < data.length; i++){
        ltAcumulado += data[i].NetOperationSeconds;
        rtAcumulado += data[i].RunTimeSeconds;
    }
    
    if (ltAcumulado === 0){
        return 1;
    }
    
    return (rtAcumulado / ltAcumulado)*100;
}

const EfficiencyIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'EfficiencyIntent';
    },
    async handle(handlerInput) {
        let speakOutput = '';
        
        let URL = 'https://prod-232.westeurope.logic.azure.com:443/workflows/28ece7692c5a481fbf111fc9d6c55278/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-7Q-VUaeIEhUYLlD3KMGqlh8TiA1X84UyJrLAtCxzuI';
        
        let repromptOutput = 'Gostaria de mais alguma informação?';
        
        try {
            const response = await getHttp(URL);
            
            let OLEValue = calculateOLEFactory(JSON.parse(response)).toPrecision(3);
           
            speakOutput = `A eficiência atual da fábrica é de ${OLEValue}%`
           
            handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(repromptOutput)
           
        } catch(error) {
            console.log(error);
            
            handlerInput.responseBuilder
                .speak(`Não foi possível obter a informação`)
                .reprompt(repromptOutput)
        }
   
        return handlerInput.responseBuilder
            .getResponse();
    }
};


function calculateOLELinha(data, linha) {
    let ltAcumulado = 0;
    let rtAcumulado = 0;
    
    for(let i = 0; i < data.length; i++){
        if (data[i].Linha === linha){
            ltAcumulado = data[i].NetOperationSeconds;
            rtAcumulado = data[i].RunTimeSeconds;
        }
    }
    
    if (ltAcumulado === 0){
        return 1;
    }
    
    return (rtAcumulado / ltAcumulado)*100;
}

function GetLineName(stringName){
    let result = "";
    
    switch (result){
        case "s. catorze":
            return "S14";
        case "s. cinco":
            return "S05";
        case "s. onze":
            return "S11";
        case "s. oito":
            return "S08";
        case "s. um":
            return "S01";
        case "s. dez":
            return "S10";
        case "s. três":
            return "S03";
        case "s. doze":
            return "S12";
            
        case "d. onze":
            return "D11";
        case "d. doze":
            return "D12";
            
        case "a. zero sete":
            return "A07";
        case "a. zero quatro":
            return "A04";
        case "a. zero dois":
            return "A02";
        case "a. zero um":
            return "A01";
        case "a. zero três":
            return "A03";
        case "a. zero seis":
            return "A06";
        case "a. zero oito":
            return "A08";
    }
    
    return result;
}

const LineEfficiencyIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LineEfficiencyIntent';
    },
    async handle(handlerInput) {
        let speakOutput = '';
        
        let URL = 'https://prod-232.westeurope.logic.azure.com:443/workflows/28ece7692c5a481fbf111fc9d6c55278/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-7Q-VUaeIEhUYLlD3KMGqlh8TiA1X84UyJrLAtCxzuI';
        
        let repromptOutput = 'Gostaria de mais alguma informação?';
        
        try {
            let productionLineParameter = handlerInput.requestEnvelope.request.intent.slots.lineName.value;
            let productionLineName = GetLineName(productionLineParameter);
            
            /*if (productionLineName === ""){
                speakOutput = `A linha ${productionLineParameter} não foi reconhecida.`
               
                handlerInput.responseBuilder
                    .speak(speakOutput)
                    .reprompt(repromptOutput)
            } else {*/
                 const response = await getHttp(URL);
            
                let OLEValue = calculateOLELinha(JSON.parse(response), productionLineParameter).toPrecision(3);
               
                speakOutput = `A eficiência atual da linha ${productionLineName} é de ${OLEValue}%`
               
                handlerInput.responseBuilder
                    .speak(speakOutput)
                    .reprompt(repromptOutput)
            //}
        } catch(error) {
            console.log(error);
            
            handlerInput.responseBuilder
                .speak(`Não foi possível obter a informação`)
                .reprompt(repromptOutput)
        }
   
        return handlerInput.responseBuilder
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Como posso ajudar?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Adeus!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Desculpe, ainda não sei como fazer isso';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        EfficiencyIntentHandler,
        LineEfficiencyIntentHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();