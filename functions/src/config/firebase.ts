import * as admin from "firebase-admin";
// import { database } from 'firebase-admin';
import * as functions from "firebase-functions";

// admin.initializeApp({
//     credential: admin.credential.cert({
//         privateKey: functions.config().private.key.replace(/\\n/g,'\n'),
//         projectId:functions.config().project.id,
//         clientEmail:functions.config().client.email,
//     }),
//     databaseUrl:'https://enutrof.firebaseio.com'
// })
admin.initializeApp(functions.config().firebase);

const db= admin.firestore();

export {db};
