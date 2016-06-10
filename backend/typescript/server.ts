import * as express from 'express';
import * as path from 'path';
import * as loggerMorgan from 'morgan';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as methodOverride from 'method-override';
import * as cApi from '../../commons/RamAPI';
import * as mongoose from 'mongoose';
import {conf} from './bootstrap';
import {logStream} from './logger';
// import {continueOnlyIfJWTisValid} from './security'
import expressValidator = require('express-validator');

import {forgeRockSimulator} from './controllers/forgeRock.simulator.middleware';
import {security} from './controllers/security.middleware';

import {AuthenticatorSimulatorController} from './controllers/authenticator.simulator.controller';
import {ResetController} from './controllers/reset.server.controller';
import {PartyController} from './controllers/party.controller';
//import {RelationshipController} from './controllers/relationship.controller';
import {RelationshipTypeController} from './controllers/relationshipType.controller';
import {RelationshipAttributeNameController} from './controllers/relationshipAttributeName.controller';

import {PartyModel} from './models/party.model';
//import {RelationshipModel} from './models/relationship-old.model';
import {RelationshipTypeModel} from './models/relationshipType.model';
import {RelationshipAttributeNameModel} from './models/relationshipAttributeName.model';

// connect to the database ............................................................................................

mongoose.connect(conf.mongoURL, {}, () => {
    console.log('Connected to db: ' + conf.mongoURL);
});

// configure express ..................................................................................................

const server = express();

switch (conf.devMode) {
    case false:
        // todo: Log to file: https://github.com/expressjs/morgan
        server.use(loggerMorgan('prod', { stream: logStream }));
        break;
    default:
        server.set('json spaces', 2);
        server.use(loggerMorgan('dev', { stream: logStream }));
        break;
}

server.use(cookieParser());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(expressValidator());
server.use(methodOverride());
server.use(express.static(path.join(__dirname, conf.frontendDir)));
server.use(express.static('swagger'));

// server.use(continueOnlyIfJWTisValid(conf.jwtSecretKey,true));

// setup security .....................................................................................................

if (conf.devMode) {
    server.use(forgeRockSimulator.prepareRequest());
}

server.use(security.prepareRequest());

if (conf.devMode) {
    server.use('/api/', new AuthenticatorSimulatorController().assignRoutes(express.Router()));
}

// setup route handlers (dev) .........................................................................................

// setup route handlers (production) ..................................................................................

server.use('/api/reset',
    new ResetController().assignRoutes(express.Router()));
server.use('/api/',
    new PartyController(PartyModel).assignRoutes(express.Router()));
//server.use('/api/',
//    new RelationshipController(RelationshipModel, PartyModel).assignRoutes(express.Router()));
server.use('/api/',
    new RelationshipTypeController(RelationshipTypeModel).assignRoutes(express.Router()));
server.use('/api/',
    new RelationshipAttributeNameController(RelationshipAttributeNameModel).assignRoutes(express.Router()));

// catch 404 and forward to error handler
server.use((req: express.Request, res: express.Response) => {
    const err = new cApi.ErrorResponse('Request Not Found');
    res.send(err);
});

// server.use((ramResponse: cApi.IResponse, req: express.Request, res: express.Response, next: express.NextFunction) => {
//     if (ramResponse.isError) {
//         res.send(ramResponse); // Todo: More specific error handling
//     } else {
//         res.send(ramResponse);
//     }
// });

// start server .......................................................................................................

server.listen(conf.httpPort);
console.log(`RAM Server running on port ${conf.httpPort}`);