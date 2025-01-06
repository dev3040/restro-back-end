# Node-Backend-V1

## 1. Prerequisites

---

#### 1) Setup NestJS in your Local system.

First of all you need to install nest js CLI using: `npm i -g @nestjs/cli`
Verify successfull installation by typing “nest -v” in CLI.

#### 2) Create New Project

Go to directory where you need to install your project and run command: `nest new your-project-name`
=> After running the above command there will be a prompt for selecting the option of package manager. Like : Which package manager would you to use? =>`choose npm`
=> After some time your project will be installed successfully and ready to run.

## 2. How To Consume BoilerPlate Project?

---

#### Clone Standard Project

Clone the latest standardization project into local from here https://gitlab.com/occoe/node-backend-v1. After that replace required folders and files from this project to your new project.
=> Keep in mind that DO NOT replace `.git` folder in your new project. Otherwise you will loose your project git repository state.

#### Consume Code from Boilerplate

Copy below mention folders into your project.

1. ###### src/shared
2. ###### src/modules => Copy as many inbuild modules as you need.
3. ###### src/config

Rest of the folders, copy as per your requirement of the project.

## 3. Overview of Boilerplate Project

---

#### 1) Folder Structure

In Biolerplate Project, we have keep all the commonly used folders and files in one place. It will be inside `src/shared` folder. Whenever you create any such folder or file, which is going to use in multiple places, then you need to add them here only.

In our project we have included:

1. ###### entities
2. ###### enums
3. ###### decorators
4. ###### exceptions
5. ###### helpers
6. ###### utilities
7. ###### interceptors

#### 2) Custom Environment Configuration

For env files, we are going to use NestJs's inbuild `@nestjs/config` module. With the help of this we can able to create multiple env files and also able to validate them when start the project. So if you missed any variable declaration in any file then it will throw error.

For detailed implementation steps of this module you can refer this ReadMe: ------

#### 3) Code Quality And Code Formatting Checker

For maintaining standard code quality and code formatting we have added some packages in this project like, i) Prettier ii) ESLint iii) Husky

##### i) Prettier

Prettier format your code in standard way. We need to set this on save file event, so everytime you save your file it will automatically format the code for you.

##### ii) ESLint

ESLint is a tool for identifying and reporting on patterns found in ECMAScript/JavaScript code, with the goal of making code more consistent and avoiding bugs.

##### ii) Husky

Husky is a tool that allows us to easily use Git hooks and run the scripts we want at those stages. As an example if we want to make sure that there must be no ESLint error before you commit your code. Then we can acheive that with Husky.

For detailed implementation and rules refer this ReadMe file: -------

#### 4) Security

##### 1. Rate Limit (Throttler)

Rate limiting is used to restrict users to hit an endpoint for a limited amount of time. In other words, by rate limiting, we can control the number of incoming requests per time. As we can define the user can hit an endpoint 10 times every minute. So, if anyone hits that endpoint more than 10 times, then it will throw an error and the user can not access that URL for a limited amount of time.

###### Advantages of Rate Limit

1. Rate limiting is mainly used for managing the frequency of incoming requests per duration.
2. Better server load management.
3. Reduced risk of attacks like Brute Force.
4. The server will never be overloaded by incoming API calls.

##### 2. Helmet

Helmet can help protect your app from some well-known web vulnerabilities by setting HTTP headers appropriately.

Helmet is a collection of several smaller middleware functions that set security-related HTTP response headers. Some examples include:

`helmet.contentSecurityPolicy` which sets the Content-Security-Policy header. This helps prevent cross-site scripting attacks among many other things.
`helmet.hsts` which sets the Strict-Transport-Security header. This helps enforce secure (HTTPS) connections to the server.
`helmet.frameguard` which sets the X-Frame-Options header. This provides clickjacking protection.
Helmet includes several other middleware functions which you can read about at its documentation website.

#### 5) Modules

##### 1) Auth

##### 2) User

##### 3) SEO - Includes dynamic SEO implementation (Meta tags, OG tags, social tags, sitemap.xml, robots.txt, google tag manager scripts etc.)

###### Summary

Dynamic SEO structure was implemented for general SEO use cases. You can manage all SEO content (Meta tags, OG tags, social tags, sitemap.xml, robots.txt, google tag manager scripts etc.) from a database using a dynamic SEO structure. To render SEO content, we must also implement code on the front-end along with Server-side rendering (SSR).

###### Database Structure

The following are two tables for managing SEO content:-

1. seo_page - to store page specific url, meta tags, og tags and social tags.
2. seo - to store common seo content like fixed meta tags, robots text file content, google tag manager scripts etc.

If you need to add any other types of tags, you can do so by adding a column in the seo_page table.
If you need to add any other common content of SEO, you can do so by adding row in the seo table.
To proceed, run the seed to add the SEO default content of your website. (npm run db:seed)

###### API Structure

The following are three APIs for managing SEO content:-

1. To get all SEO tags
   i) Call this API to retrieve all fixed (common) SEO tags and scripts that can be set in the header component (in front-end). Where the "page"(param) value should be "default".
   ii) Call this API to retrieve page specific SEO tags that can be set in that page related component (in front-end). Where the "page"(param) value should be "{{page-name}}" (for example:- if you're requesting SEO content for Privacy Policy page, the "page" value should be "privacy-policy")

2. To get sitemap file data - to fetch URLs for rendering the sitemap.xml file (in front-end)

3. To get robots file data - to fetch text for rendering the robots.txt file (in front-end)

Implemented caching in the seo.controller.ts file to improve the performance of retrieving sitemap and robots file content.

###### Implementation required from front-end (Angular)

1. Install angular-universal npm package for SSR.

2. Write code to generate sitemap.xml and robots.txt in server.js file.

3. When the route changes, use the SEO page API and set meta tags using the platform-browser's meta method in the app.component.ts file. (import { Meta, Title } from '@angular/platform-browser';)

4. To deploy your angular web on a server, you must run your project through a proxy port (SSR), which you may configure in the server.js file. (pm2 start dist/my-project/server/main.js --name 'My-Project')

###### References

1. To general SEO content structure :- https://docs.google.com/spreadsheets/d/1P8JYFJ9Us-VxQZvjwZzL2cDWoALk4SklE1owmIEcu8s/edit#gid=0
2. To generate sitemap.xml file in front-end :- https://www.npmjs.com/package/sitemap
3. To install angular-universal(for SSR) in front-end :- https://www.npmjs.com/package/@nguniversal/express-engine

###### Implementation of RolesGuard in Project

**Why RolesGuard?**
So, basically as the name suggests the purpose of this guard is to prevent unauthorized access to certain routes or resources based on the user's role.

1. First we need to import RolesGuard as a second parameter in UseGuards decorator in the Controller file. For Ex --> **@UseGuards(AuthGuard("jwt"), RolesGuard)**

2. Then we need to add Roles enum in the Roles decorator in the Controller file below UseGuards decorator.
   For Ex --> **@Roles(Role.ADMIN)**. _=> For Single Role_
   For Ex --> **@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.PAID_USER)**. _=> For Multiple Roles_

## Utilities

> Different kinds of utilities have been used in this project

-   [FCM -> Firebase Cloud Messaging](#fcm---firebase-cloud-messaging)
-   [S3 -> AWS S3 bucket](#s3---aws-s3-bucket)
-   [Twilio -> Twilio Apis](#twilio---twilio-apis)

### FCM -> Firebase Cloud Messaging

This utility file is to send push notification in an application using user's device token.

1. First it gets the server key we have placed in the configuration file
2. Using that server key it creates a new FCM object
3. The generated FCM object is used to call send api provided by fcm to send push notification to various devices
4. Content in the notificationa and other features such as notification object can be managed according to our requirement

Working flow will be as follows:

> You can call the sendPushNotification method of fcm utility in any service or repository file by injecting the utility file in constructor.

> When you call the sendPushNotification method you will have to pass on the following contents:

1. All device tokens of user to which you want to send the notification
2. Content with title and body for notification. There are 2 types of content available for send notification -> data and pushdata
    > data: this data will show in app when notification is clicked
    > pushData: this data will be shown in push notification
3. A flag stating true or false to determine whether you want to show notification content in app or not
4. Your FCM server key

This is all that you will need to know about fcm utility used in this project.

### S3 -> AWS S3 bucket

This utility file is used for uploading files in s3 bucket to Amazon.

1. First it gets the server key we have placed in the configuration file

2. Using that server key it creates a new S3 connection

3. Then there is 3 functions available
    > 1. uploadS3 : it will upload the file to s3 bucket and required params are file, bucket, name, mimeType
    > 2. deleteFileFromS3 :For deleting file from the s3 bucket
    > 3. generatePresignedUrl : Get Pre Signed URL of File from S3 bucket to show it in frontend

### Twilio -> Twilio Apis

This utility file is using twilio services as sms sending video calling and recordings.

1. First it gets the server key we have placed in the configuration file

2. Using that server key it creates a new twilio client connection

3. There is 5 functions available
    > 1. sendSMS : To send messages to particular number with message details
    > 2. accessTokenForRoom : Create access token for room creation and added video grant to that token
    > 3. createCompositionRoom : Create composition for transcode like combine video and recording
    > 4. compositionCallback : Get composition details by compostion id retrieve composition
    > 5. getRecordingUrl : Get composition details when the compostion is completed
