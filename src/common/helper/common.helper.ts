import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import * as moment from 'moment';
import { IPaginationMeta } from 'nestjs-typeorm-paginate';
/**
 * encrypt password
 * @param textToEncrypt
 * @returns
 */
export const encrypt = async (textToEncrypt: string) => {
  const AES_ENC_KEY_BUFFER = Buffer.from(process.env.AES_ENC_KEY, 'hex');
  const AES_IV_BUFFER = Buffer.from(process.env.AES_IV, 'hex');

  const cipher = createCipheriv(
    'aes-256-cbc',
    AES_ENC_KEY_BUFFER,
    AES_IV_BUFFER,
  );
  let encrypted = cipher.update(textToEncrypt, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
};

/**
 * decrypt password
 * @param encryptToText
 * @returns
 */
export const decrypt = async (encryptToText: string) => {
  const AES_ENC_KEY_BUFFER = Buffer.from(process.env.AES_ENC_KEY, 'hex');
  const AES_IV_BUFFER = Buffer.from(process.env.AES_IV, 'hex');

  const decipher = createDecipheriv(
    'aes-256-cbc',
    AES_ENC_KEY_BUFFER,
    AES_IV_BUFFER,
  );
  const decrypted = decipher.update(encryptToText, 'base64', 'utf8');
  return decrypted + decipher.final('utf8');
};

/**
 * date to timestamp convert
 * @param date
 * @returns
 */
export const dateToTimestamp = (date: string) => {
  return moment.utc(date).unix();
};

/**
 * set date format
 * @param date
 * @param formate
 * @returns
 */
export const formateDate = (date: any, formate = 'DD/MM/YYYY') => {
  return moment.utc(date).format(formate);
};

export const generateMeta = (data: Partial<IPaginationMeta>) => {
  const totalItems = Number(data.totalItems);
  return {
    totalItems: totalItems,
    itemsPerPage: data.itemsPerPage,
    totalPages: Math.ceil(totalItems / data.itemsPerPage),
    currentPage: data.currentPage,
  };
};

/**
 * Set number formate
 * @param value
 * @param digit
 * @returns
 */
export const numberFormat = (value: number, digit: number) => {
  if (value === undefined) return 0;
  return parseFloat(value.toFixed(digit));
};

/**
 * Generate unique ID
 * @param prefix
 * @returns
 */
export const generateUniqueId = async (prefix: string) => {
  return `${prefix}${randomBytes(4).toString('hex')}${moment().unix()}`;
};

/**
 * Check if external url is valid or not
 * @param url
 * @returns
 */
export const isUrlValid = (url: any) => {
  if (typeof url === 'string')
    if (url.indexOf('http') == 0) {
      return true;
    } else {
      return false;
    }
  return false;
};

/**
 * send push
 * @param tokens
 * @param payload
 */
// export const sendPush = (
//   tokens: string[],
//   payload: {
//     notification: { title: string; body: string };
//     data: any; //{ type: string; vlogId: '0' };
//   },
// ) => {
//   const appConfig = new AppConfig();
//   const connection = new Connection({
//     type: 'mysql',
//     host: appConfig.configService.get('DB_HOST'),
//     port: appConfig.configService.get('DB_PORT'),
//     username: appConfig.configService.get('DB_USERNAME'),
//     password: appConfig.configService.get('DB_PASSWORD'),
//     database: appConfig.configService.get('DB_DATABASE'),
//     entities: [DeviceTokens, Users],
//   });
//   const myDataSource = connection.connect();

//   if (tokens.length > 0) {
//     admin
//       .messaging()
//       .sendToDevice(tokens, payload)
//       .then(async (result) => {
//         const failedTokens = [];

//         result.results.forEach((deviceResult, index) => {
//           if (deviceResult.error) {
//             failedTokens.push(tokens[index]);
//             // Now use this token to delete it from your DB, or mark it failed according to your requirements.
//           }
//         });

//         if (failedTokens.length > 0)
//           // Delete unuse tokens
//           await (await myDataSource)
//             .getRepository(DeviceTokens)
//             .createQueryBuilder()
//             .delete()
//             .from(DeviceTokens)
//             .where('token IN(:...token)', { token: failedTokens })
//             .execute();
//       })
//       .catch((error) => {
//         console.log(error);
//       });
//   }
// };
