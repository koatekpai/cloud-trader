/*global fetch*/
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

//-> crate commands for extracting parameter values
const identifier_command = new GetParameterCommand({
    Name: '/cloud-trader/identifier',
    WithDecryption: false
});
const key_command = new GetParameterCommand({
    Name: '/cloud-trader/key',
    WithDecryption: true
});
const password_command = new GetParameterCommand({
    Name: '/cloud-trader/password',
    WithDecryption: true
});
const url_command = new GetParameterCommand({
    Name: '/cloud-trader/capitalDemoUrl',
    WithDecryption: false   
});
const REGION = process.env.AWS_REGION
const client = new SSMClient({region: REGION})

const ENDPOINT = '/session';

// CT_IDENTIFIER: /cloud-trader/identifier         # TODO: Each user would persist as account settings in DB
// CT_KEY: /cloud-trader/key                       # TODO: Each user would persist as account settings in DB
// CT_PASSWORD: /cloud-trader/password             # TODO: Each user would persist as account settings in DB
// CT_DEMO_URL: /cloud-trader/capitalDemoUrl       # TODO: Each user would persist as account settings in DB

export const handler = async (event) => {
    // Run the commands and retrieve parameter store values
    const { Parameter: { Value: IDENTIFIER } } = await client.send(identifier_command);
    const { Parameter: { Value: KEY } } = await client.send(key_command);
    const { Parameter: { Value: PASSWORD } } = await client.send(password_command);
    const { Parameter: { Value: BASE_URL } } = await client.send(url_command);

    const url = BASE_URL + ENDPOINT;
    return doStartSession(event, url, KEY, IDENTIFIER, PASSWORD);
}

/**
 * Initiates a session with the Capital.com API using the provided credentials.
 *
 * @param {string} url - The API endpoint URL for starting the session.
 * @param {string} KEY - API key for authentication.
 * @param {string} IDENTIFIER - User identifier (e.g., email address).
 * @param {string} PASSWORD - User password.
 * @returns {Object} - Returns an object containing CST (Client Session Token) and TOKEN (Security Token)
 *                   if the session is successfully started, or an error response otherwise.
 */
export const doStartSession = async (
    event = {},
    url = "http://endpoint.com",
    KEY = "DEMO-KEY",
    IDENTIFIER = "name@email.com",
    PASSWORD = "abc-123-!"
) => {

    const headers = {
        'X-CAP-API-KEY': KEY,
        'Content-Type': 'application/json'
    };
    const postBody = {
        "identifier": IDENTIFIER,
        "password": PASSWORD
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(postBody)
        });

        if (response.status >= 400 && response.status < 500) {
            //-> Capital.com returns error responses in json format eg: {"errorCode": "error.invalid.details"}
            const errCode = await response.json();
            return {
                message: `
                    Error getting session from capital.com
                    Capital.com Error Code: ${errCode?.errorCode}
                `
            }
        }

        const CST = response.headers.get('CST');
        const TOKEN = response.headers.get('X-SECURITY-TOKEN');

        return {
            session: {
                CST: CST,
                TOKEN: TOKEN
            },
            data: event.data
        }
    } catch (err) {   // TODO: Check better way of handling this error.
        // console.log(err);
        return {
            message: `
            Could not fetch with the following parameters: 
            -> X-CAP-API-KEY: ${KEY}
            -> IDENTIFIER: ${IDENTIFIER}
            -> PASSWORD: ****** given password.
            `
        };
    }
}
