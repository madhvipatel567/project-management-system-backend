import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { MEDIA_TYPES } from 'src/api/task-attachments/entities/task-attachment.entity';
import { AppConfig } from '../config/app.config';
import { EXPORT_FILENAME, STORAGE_PATH } from '../constants';
import * as fs from 'fs';
import { Workbook } from 'exceljs';

const appConfig = new AppConfig();

/**
 * Filter image
 * @param file
 * @returns
 */
export const imageFileFilter = (file) => {
  const regExp = /\.(jpg|jpeg|png|gif)$/;
  if (!file.originalname.match(regExp)) return false;
  else return true;
};

/**
 * Filter xlsx file
 * @param file
 * @returns
 */
export const xlsxFileFilter = (file) => {
  const regExp = /\.(xlsx)$/;
  if (!file.originalname.match(regExp)) return false;
  else return true;
};

/**
 * Filter pdf file
 * @param file
 * @returns
 */
export const pdfFileFilter = (file) => {
  const regExp = /\.(pdf)$/;
  if (!file.originalname.match(regExp)) return false;
  else return true;
};

/**
 * Filter document file
 * @param file
 * @returns
 */
export const docFileFilter = (file) => {
  const regExp = /\.(doc|docx)$/;
  if (!file.originalname.match(regExp)) return false;
  else return true;
};

/**
 * Filter video file
 * @param file
 * @returns
 */
export const videoFileFilter = (file) => {
  const regExp = /\.(mp4|wmv|mov|)$/;
  if (!file.originalname.match(regExp)) return false;
  else return true;
};

/**
 * upload file
 * @param dir
 * @param file
 * @returns
 */
export const uploadFile = (dir: any, file: any) => {
  const randomName = Array(32)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  const fileName = `${dir}/${randomName}${extname(file.originalname)}`;

  const storageDirExists = existsSync(`/${STORAGE_PATH}/`);
  if (!storageDirExists) mkdirSync(`${STORAGE_PATH}/`, { recursive: true });

  const exists = existsSync(`${STORAGE_PATH}/${dir}`);
  if (!exists) mkdirSync(`${STORAGE_PATH}/${dir}`);

  writeFileSync(`${STORAGE_PATH}/${fileName}`, file.buffer);

  return fileName;
};

/**
 * upload multiple files
 * @param dir
 * @param file
 * @returns
 */
export const uploadFiles = async (
  dir: any,
  files: any,
  isTaskCompletedAttachment,
) => {
  const fileNames = await Promise.all(
    files.map(async (file) => {
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
      const fileName = `${dir}/${randomName}${extname(file.originalname)}`;

      let type = null;
      if (imageFileFilter(file)) type = MEDIA_TYPES.IMAGE;
      else if (docFileFilter(file)) type = MEDIA_TYPES.DOCUMENT;
      else if (pdfFileFilter(file)) type = MEDIA_TYPES.PDF;
      else if (videoFileFilter(file)) type = MEDIA_TYPES.VIDEO;

      const storageDirExists = existsSync(`/${STORAGE_PATH}/`);
      if (!storageDirExists) mkdirSync(`${STORAGE_PATH}/`, { recursive: true });

      const exists = existsSync(`${STORAGE_PATH}/${dir}`);
      if (!exists) mkdirSync(`${STORAGE_PATH}/${dir}`);

      writeFileSync(`${STORAGE_PATH}/${fileName}`, file.buffer);

      if (type === MEDIA_TYPES.VIDEO) {
        // make thumbnail & Add seconds
        return {
          media: fileName,
          mediaType: type,
          seconds: 0,
          mediaThumbnail: null,
          originalname: file.originalname,
          isTaskCompletedAttachment,
        };
      }

      return {
        media: fileName,
        mediaType: type,
        originalname: file.originalname,
        isTaskCompletedAttachment,
      };
    }),
  );

  return fileNames;
};

/**
 * Copy files
 * @param dir
 * @param files
 * @returns
 */
export const copyFiles = async (dir: any, files: any) => {
  const fileNames = await Promise.all(
    files.map(async (file) => {
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
      const fileName = `${dir}/${randomName}${extname(file.originalname)}`;

      const inStr = fs.createReadStream(
        join(__dirname, '../../..', `/public/storage/${file.media}`),
      );
      const outStr = fs.createWriteStream(
        join(__dirname, '../../..', `/public/storage/${fileName}`),
      );

      inStr.pipe(outStr);

      return {
        media: fileName,
        mediaType: file.mediaType,
        seconds: file.seconds,
        mediaThumbnail: file.mediaThumbnail,
        originalname: file.originalname,
      };
    }),
  );
  return fileNames;
};

/**
 * delete file
 * @param {string} file
 * @returns
 */
export const deleteFile = (file) => {
  const path = `./${STORAGE_PATH}/${file}`;
  if (existsSync(path)) {
    unlinkSync(path);
  }
  return true;
};

/**
 * get storage url
 * @param file
 * @returns
 */
export const castToStorage = (file: string) => {
  return file ? appConfig.storagePath(file) : file;
};

export const createXlsxFile = async (
  data: any,
  _fileName: string,
  tablename: string,
) => {
  const fileName = `${_fileName}.xlsx`;
  const fileType =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  const rows = [];
  if (tablename === EXPORT_FILENAME.ACADEMICYEAR_MODULE) {
    data.map((items: any) => {
      delete items['id'];
      delete items['createdAt'];
      delete items['updatedAt'];
      delete items['isDefault'];
      rows.push(Object.values(items));
    });
  } else if (tablename === EXPORT_FILENAME.TASK_MODULE) {
    data.map((items: any) => {
      delete items['id'];
      delete items['createdAt'];
      delete items['updatedAt'];
      delete items['order'];
      rows.push(Object.values(items));
    });
  } else if (tablename === EXPORT_FILENAME.TEAM_MODULE) {
    data.map((items: any) => {
      delete items['id'];
      delete items['createdAt'];
      delete items['updatedAt'];
      rows.push(Object.values(items));
    });
  } else if (tablename === EXPORT_FILENAME.USER_MODULE) {
    data.map((items: any) => {
      delete items['id'];
      delete items['createdAt'];
      delete items['updatedAt'];
      delete items['providerId'];
      delete items['password'];
      delete items['isNotificationOn'];
      delete items['isEmailMessageOn'];
      delete items['lastLoggedInAt'];
      delete items['providerType'];
      delete items['profilePic'];
      delete items['phoneNumber'];
      delete items['address'];
      delete items['country'];
      delete items['state'];
      delete items['city'];
      delete items['pincode'];
      delete items['points'];
      delete items['remark'];
      delete items['isActive'];
      delete items['phone'];
      delete items['deletedAt'];
      rows.push(Object.values(items));
    });
  } else {
    data.map((items: any) => {
      delete items['password'];
      rows.push(Object.values(items));
    });
  }

  const book = new Workbook();
  const sheet = book.addWorksheet(_fileName);

  rows.unshift(Object.keys(data[0]));

  sheet.addRows(rows);

  const storageDirExists = existsSync(`/${STORAGE_PATH}/`);
  if (!storageDirExists) mkdirSync(`${STORAGE_PATH}/`, { recursive: true });

  const exists = existsSync(`${STORAGE_PATH}/xlsx`);
  if (!exists) mkdirSync(`${STORAGE_PATH}/xlsx`);

  await book.xlsx.writeFile(`${STORAGE_PATH}/xlsx/${fileName}`);

  const file = fs.readFileSync(`${STORAGE_PATH}/xlsx/${fileName}`);

  return {
    file,
    fileType,
    fileName,
  };
};
