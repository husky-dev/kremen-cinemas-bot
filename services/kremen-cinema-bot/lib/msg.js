// Helpers

const RN = '\r\n';
const DRN = `${RN}${RN}`;

// Commands
/*
schedule - Розклад сеансів
help - Допомога
subscribe - Підписатись на оновлення
unsubscribe - Відписатись від оновленнь
*/

const commandsText = `
/schedule - розклад сеансів
/help - допомога
/subscribe - Підписатись на оновлення
/unsubscribe - Відписатись від оновленнь
`;

const helpMsg = `
Я вмію виконувати наступні команди:
${commandsText}
Контакти:
https://fb.me/snipter
`;

const startMsg = `
Привіт 😊! Я збираю інформацію про сеанси фільмів в Кременчуці і можу відправляти вам розклад в зручному форматі. Я можу виконувати наступні команди:
${commandsText}
`;

const sorryMsg = `
Вибате, але я не зрозумів вас 😕. Я можу виконувати наступні команди:
${commandsText}
`;

const serviceErrMsg = `
Вибачте, але сервіс тимчасово недоступний 😕
`;

const cmdParamErr = `
Невірний параметр команди 😕
`;

const waitMsg = `
Хвилинку...
`;

const loginedMsg = `
Ви успішно авторизовані у якості адміну! 😊
`;

const logoutMsg = `
Ви успішно вийшли з системи 😊
`;

const logoutErrMsg = `
Помилка виходу з системи 😕
`;

const subscribeMsg = `
Ви підписались на оновлення 😊. Тепер ви будете отримувати інформацію про нові фільми в кінотеатрі
`;

const unsubscribeMsg = `
Ви відписались від оновлень 😕. Підписку завжди можна відновити виконавши команду /subscribe
`;

// Exports
module.exports = {
  RN,
  DRN,
  commandsText,
  helpMsg,
  startMsg,
  sorryMsg,
  serviceErrMsg,
  cmdParamErr,
  waitMsg,
  loginedMsg,
  logoutMsg,
  logoutErrMsg,
  subscribeMsg,
  unsubscribeMsg,
};
