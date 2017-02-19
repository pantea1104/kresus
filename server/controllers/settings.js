import Config from '../models/config';

import * as weboob from '../lib/sources/weboob';
import Emailer from '../lib/emailer';

import {
    KError,
    asyncErr,
    setupTranslator
} from '../helpers';

async function postSave(key, value) {
    switch (key) {
        case 'mail-config':
            await Emailer.forceReinit();
            break;
        case 'locale':
            setupTranslator(value);
            break;
        default:
            break;
    }
}

export async function save(req, res) {
    try {
        let pair = req.body;

        if (typeof pair.key === 'undefined') {
            throw new KError('Missing key when saving a setting', 400);
        }
        if (typeof pair.value === 'undefined') {
            throw new KError('Missing value when saving a setting', 400);
        }

        let found = await Config.findOrCreateByName(pair.key, pair.value);
        if (found.value !== pair.value) {
            found.value = pair.value;
            await found.save();
        }

        await postSave(pair.key, pair.value);

        res.sendStatus(200);
    } catch (err) {
        return asyncErr(res, err, 'when saving a setting');
    }
}

export async function updateWeboob(req, res) {
    try {
        await weboob.updateWeboobModules();
        res.sendStatus(200);
    } catch (err) {
        return asyncErr(res, err, 'when updating weboob');
    }
}

export async function testEmail(req, res) {
    try {
        let { config } = req.body;
        if (!config) {
            throw new KError('Missing configuration object when trying to send a test email', 400);
        }

        if (config.tls && typeof config.tls.rejectUnauthorized === 'string') {
            config.tls.rejectUnauthorized = config.tls.rejectUnauthorized === 'true';
        }

        await Emailer.sendTestEmail(config);
        res.sendStatus(200);
    } catch (err) {
        return asyncErr(res, err, 'when trying to send an email');
    }
}
