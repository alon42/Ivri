// https://developers.google.com/calendar/api/quickstart/js
import { format } from "date-fns";
import {arrayOfDatesToRDATE} from "../helpers/rfcHelper.js";

const API_KEY = "AIzaSyDMxqXQUotFEdPp3a5YuIpmY7bhhDvhsiQ";
const CLIENT_ID = "1020980711555-6v96l8to8mo51b1j2hblbkfj1iih4p04.apps.googleusercontent.com";
// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC_ARR = [
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
  "https://www.googleapis.com/discovery/v1/apis/people/v1/rest",
];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");
let tokenClient;
function injectScript(src) {
  return new Promise(function (resolve, reject) {
    let s = document.querySelector('script[src="' + src + '"]');
    let shouldAppend = false;
    if (!s) {
      s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = function () {
        s.setAttribute("data-loaded", true);
        loadLibrary.loaded = true;
        console.log("loadLibrary loaded");
        resolve();
      };
      s.onerror = reject;
      shouldAppend = true;
    } else if (s.hasAttribute("data-loaded")) {
      loadLibrary.loaded = true;
      console.log("loadLibrary been loaded");
      resolve();
    }
    if (shouldAppend) {
      document.head.appendChild(s);
    }
  });
}

async function loadLibrary() {
  await Promise.all([
    injectScript("https://accounts.google.com/gsi/client"),
    injectScript("https://apis.google.com/js/api.js"),
  ]);
}

export function handleAuthClick() {
  return new Promise((resolve, reject) => {
    tokenClient.callback = async (resp) => {
      if (resp.error !== undefined) {
        reject(resp);
      }
      console.log("resp: ", resp);
      // Save the token to localStorage so that it is available after reloading the page.
      localStorage.setItem("GoogleToken", JSON.stringify(resp));
      resolve(resp);
    };

    if (window.gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      tokenClient.requestAccessToken({ prompt: "consent" });
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({ prompt: "" });
    }
  });
}
export async function initClient() {
  await loadLibrary();
  return new Promise((resolve, reject) => {
    window.gapi.load("client", () => {
      window.gapi.client
        .init({
          apiKey: API_KEY,
          discoveryDocs: DISCOVERY_DOC_ARR,
        })
        .then(() => {
          try {
            const credentials = JSON.parse(localStorage.getItem("GoogleToken"));
            if (credentials && credentials.access_token) {
              window.gapi.client.setToken(credentials);
            }
            resolve();
          } catch (err) {
            console.log("err: ", err);
            reject(err);
          }
        });
    });

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: "", // defined later in handleAuthClick
    });

  }); // end promise
}

export function isSignedIn() {
  if (!window.gapi || !window.gapi.client) {
    return false;
  }
  return window.gapi.client.getToken() !== null;
}

export function signOut() {
  localStorage.removeItem("GoogleToken");
  window.gapi.auth2.getAuthInstance().signOut();
}

export async function getUserInfo() {
  try {
    const response = await window.gapi.client.people.people.get({
      'resourceName': 'people/me',
      'requestMask.includeField': 'person.names'
    })
    return response.result;
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function listUpcomingEvents() {
  let response;
  try {
    const request = {
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: 10,
      orderBy: "startTime",
    };
    response = await window.gapi.client.calendar.events.list(request);
  } catch (err) {
    throw new Error(err);
  }

  const events = response.result.items;
  return events;
}

async function _insertEvent(event) {
  try {
    const request = {
      calendarId: "primary",
      resource: event,
    };
    const response = await window.gapi.client.calendar.events.insert(request);
    return response;
  } catch (err) {
    console.error(err);
    return null;
  }
}
export async function insertEvent(datesArr, event) {
  const dateFormatted = format(datesArr[0], "yyyy-MM-dd");
  
  // build reccuring event by dates 
  // https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.5.2
  const RECURRENCE_STR = arrayOfDatesToRDATE(datesArr);

  const buildEvent = {
    summary: event.summary,
    location: event.location,
    description: event.description,
    start: {
      date: dateFormatted,
    },
    end: {
      date: dateFormatted,
    },
    recurrence: [RECURRENCE_STR],
    // end: {
    //   dateTime: '2015-05-28T17:00:00-07:00',
    //   timeZone: 'America/Los_Angeles'
    // },

    // reminders: {
    //   useDefault: false,
    //   overrides: [
    //     { method: 'email', minutes: 24 * 60 },
    //     { method: 'popup', minutes: 10 }
    //   ]
    // }
  };

  return _insertEvent(buildEvent);
}
