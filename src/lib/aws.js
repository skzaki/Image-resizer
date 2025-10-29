import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      region: "ap-south-1",
      userPoolId: "ap-south-1_Srp2zjFZJ",
      userPoolClientId: "4osg6le4vo1vtlm90k2duineb1",
      identityPoolId: "ap-south-1:4a104d57-bbc5-4c4a-aff0-73429a53a7b7",
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
        username: true,
      },
    },
  },
  Storage: {
    S3: {
      region: "ap-south-1",
      bucket: "img-resizer-app",
      defaultAccessLevel: "private",
    },
  },
});
