import * as PdfEngine from './engine/chromeheadless.js';
import { logger, Service } from '@microrealestate/common';
import dataPicker from './datapicker.js';
import ejs from 'ejs';
import fs from 'fs';
import { Mutex } from 'async-mutex';
import path from 'path';
import templateFunctions from './utils/templatefunctions.js';

const mutex = new Mutex();

const settings = {
  'view engine': ejs.renderFile,
  'pdf engine': PdfEngine
};

export function set(key, value) {
  settings[key] = value;
}

export async function start() {
  const { TEMPORARY_DIRECTORY, PDF_DIRECTORY } =
    Service.getInstance().envConfig.getValues();

  if (!fs.existsSync(PDF_DIRECTORY)) {
    fs.mkdirSync(PDF_DIRECTORY);
  }
  if (!fs.existsSync(TEMPORARY_DIRECTORY)) {
    fs.mkdirSync(TEMPORARY_DIRECTORY);
  }
  await settings['pdf engine'].start();
}

export async function exit() {
  const { TEMPORARY_DIRECTORY } = Service.getInstance().envConfig.getValues();
  fs.rmSync(TEMPORARY_DIRECTORY);
  await settings['pdf engine'].exit();
}

export async function generate(documentId, params) {
  const { TEMPLATES_DIRECTORY } = Service.getInstance().envConfig.getValues();

  const templateFile = path.join(TEMPLATES_DIRECTORY, `${documentId}.ejs`);
  if (!fs.existsSync(templateFile)) {
    logger.error(
      `cannot generate file for a not existing template ${templateFile}`
    );
    throw new Error(
      `cannot generate file for a not existing template ${templateFile}`
    );
  }

  return await mutex.runExclusive(async () => {
    const data = await dataPicker(documentId, params);
    
    // Prioritize Dominican Spanish for this organization
    // Use landlord locale if it's es-DO, otherwise use params locale, then fallback
    const locale = (data.landlord.locale === 'es-DO') ? 'es-DO' : (params.locale || data.landlord.locale || 'en-US');
    
    const html = await settings['view engine'](
      templateFile,
      {
        ...data,
        _: templateFunctions({
          locale: locale,
          currency: data.landlord.currency
        })
      },
      { root: TEMPLATES_DIRECTORY }
    );

    return await settings['pdf engine'].generate(
      documentId,
      html,
      data.fileName
    );
  });
}
