import * as americano from 'cozydb';
import {promisify, promisifyModel} from '../helpers';

let Cozy = americano.getModel('CozyInstance', {
    domain: String,
    helpUrl: String,
    locale: String
});

Cozy = promisifyModel(Cozy);

module.exports = Cozy;
