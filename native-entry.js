import {Capacitor} from '@capacitor/core';
import {FirebaseAuthentication} from '@capacitor-firebase/authentication';
import * as app from 'firebase/app';
import * as auth from 'firebase/auth';
import * as firestore from 'firebase/firestore';
window.PlanaltoFirebaseSdk={...app,...auth,...firestore};
window.PlanaltoNativeAuth=Capacitor.isNativePlatform()?FirebaseAuthentication:null;
