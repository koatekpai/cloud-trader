/*global fetch*/
import { getParameter } from '../../opt/parameterStore.mjs';
import { nowTime } from "../../opt/common.mjs";

const CT_IDENTIFIER = process.env.CT_IDENTIFIER;
const CT_KEY = process.env.CT_KEY;
const CT_PASSWORD = process.env.CT_PASSWORD;
const CT_DEMO_URL = process.env.CT_DEMO_URL;
const SESSION_ENDPOINT = process.env.SESSION_ENDPOINT;

// CT_IDENTIFIER: /cloud-trader/identifier         # TODO: Each user would persist as account settings in DB
// CT_KEY: /cloud-trader/key                       # TODO: Each user would persist as account settings in DB
// CT_PASSWORD: /cloud-trader/password             # TODO: Each user would persist as account settings in DB
// CT_DEMO_URL: /cloud-trader/capitalDemoUrl       # TODO: Each user would persist as account settings in DB

export const handler = async (event) => {
    // Run the commands and retrieve parameter store values
    const IDENTIFIER = await getParameter(CT_IDENTIFIER, false);
    const KEY = await getParameter(CT_KEY, true);
    const PASSWORD = await getParameter(CT_PASSWORD, true);
    const BASE_URL = await getParameter(CT_DEMO_URL, false);

    const url = BASE_URL + SESSION_ENDPOINT;
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
        const TIME_LAST_ACTIVE = nowTime();

        return {
            session: {
                CST: CST,
                TOKEN: TOKEN,
                TIME_LAST_ACTIVE: TIME_LAST_ACTIVE
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
