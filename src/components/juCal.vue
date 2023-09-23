<template>
<h1>הכנסת תאריכים עבריים לתוך יומן דיגיטלי</h1>

<ion-input label="* נושא האירוע" placeholder="לדוגמא: יום הולדת / בר מצווה / יום זכרון" v-model="event.summary" @ionInput="validateNotEmpty" @ionBlur="markTouched" ref="input" error-text="שדה זה חובה, אנא הזינו פה ערך"></ion-input>

<ion-item>
    <ion-label>*תאריך</ion-label>
    <select v-model="jewDate.year" @change="onYearChange($event);createFutureDates()">
        <option v-for="year in FORM_DATA.YEARS" :key="year.id" :value="year.id">{{ year.text }}</option>
    </select>
    <select v-model="jewDate.monthName" @change="createFutureDates()">
        <option v-for="hm in FORM_DATA.MONTHS" :key="hm.id" :value="hm.id">{{ hm.text }}</option>
    </select>
    <select v-model="jewDate.day" @change="createFutureDates()">
        <option v-for="hm in FORM_DATA.DAYS" :key="hm.id" :value="hm.id">{{ hm.text }}</option>
    </select>
    <ion-note slot="end">{{ format(toGregorianDate(jewDate),"dd/MM/yyyy") }}</ion-note>
</ion-item>
<ion-item>
    <ion-label>חזרות</ion-label>
    <ion-input type="number" v-model="eventOccurrences.total" min="1" max="240" @change="createFutureDates()"></ion-input>
    <select v-model="eventOccurrences.type" @change="createFutureDates()">
        <option value="YEARLY">שנתי</option>
        <option value="MONTHLY">חודשי</option>
    </select>
</ion-item>
<ion-item>
    <ion-input label="מיקום" placeholder="מיקום" v-model="event.location"></ion-input>
</ion-item>
<ion-item>
    <ion-textarea label="פרטים נוספים" placeholder="מידע נוסף לגבי האירוע" v-model="event.description"></ion-textarea>
</ion-item>
<ion-item>

    <ion-button @click="insertEvents">
        <ion-icon :icon="logoGoogle"></ion-icon> שמירה ליומן גוגל
    </ion-button>
    <ion-button @click="saveToIcal">
        <ion-icon :icon="document"></ion-icon> שמירה לקובץ בפורמט ICAL
    </ion-button>

</ion-item>

<h2>תאריכים עתידיים</h2>
<ul>
    <li v-for="dateObj in occurrencesGeorgianDated" v-bind:key="dateObj">
        {{ formatJewishDateInHebrew(toJewishDate(dateObj))  }} {{ format(dateObj,"dd/MM/yyyy") }}
    </li>
</ul>
</template>

<script>
import {
    defineComponent
} from 'vue'
import {
    toJewishDate,
    formatJewishDate,
    toHebrewJewishDate,
    formatJewishDateInHebrew,
    toGregorianDate,
    // JewishMonth,
} from "jewish-date";
import * as jdc from "jewish-dates-core";
import * as gCalApi from "./../libs/Gapi.js"
import {
    saveAs
} from 'file-saver';
import {
    v4 as uuidv4
} from 'uuid';
import {
    format
} from 'date-fns';
import gematriya from "gematriya";
import {
    IonItem,
    IonLabel,
    IonInput,
    IonNote,
    IonTextarea,
    IonIcon
} from '@ionic/vue';

import {
    logoGoogle,
    document
} from 'ionicons/icons';
import {
    arrayOfDatesToRDATE
} from "../helpers/rfcHelper.js"

export default defineComponent({
    name: 'juCal',
    data() {
        return {
            msg: 'juCal',
            FORM_DATA: {
                YEARS: [],
                MONTHS: [],
                DAYS: []
            },
            event: {
                summary: '',
                description: '',
                location: '',
            },
            startDate: new Date().toISOString().slice(0, 10),
            jewDate: toJewishDate(new Date()),
            eventOccurrences: {
                total: 1,
                type: "YEARLY",
            },
            occurrencesGeorgianDated: [],
            events: [],
        }
    },
    methods: {
        toJewishDate,
        formatJewishDate,
        toHebrewJewishDate,
        formatJewishDateInHebrew,
        toGregorianDate,
        format,
        validateNotEmpty(ev) {
            const value = ev.target.value;

            this.$refs.input.$el.classList.remove('ion-valid');
            this.$refs.input.$el.classList.remove('ion-invalid');
            value !== '' ?
                this.$refs.input.$el.classList.add('ion-valid') :
                this.$refs.input.$el.classList.add('ion-invalid');
        },

        markTouched() {
            this.$refs.input.$el.classList.add('ion-touched');
        },
        gematriya,
        onYearChange() {
            this.FORM_DATA.MONTHS = jdc.getJewishMonths(this.jewDate.year, true);
        },
        createFutureDates() {

            const jDate = {
                ...this.jewDate
            }
            const occurrencesGeorgianDated = []
            for (let i = 0; i < this.eventOccurrences.total; i++) {
                const gDate = toGregorianDate(jDate);
                occurrencesGeorgianDated.push(gDate)
                if (this.eventOccurrences.type === "MONTHLY") {
                    //increment the Jewish date by one month
                    const jDateNextMonth = jdc.getNextMonth({
                        isHebrew: true,
                        month: jDate.monthName,
                        year: jDate.year,
                    });
                    jDate.monthName = jDateNextMonth.month;
                    jDate.year = jDateNextMonth.year;
                } else {
                    //increment the Jewish date by one year
                    jDate.year++;
                }
            }
            this.occurrencesGeorgianDated = occurrencesGeorgianDated
        },
        saveToIcal() {

            const SUMMARY = this.event.summary;
            const DESCRIPTION = this.event.description;
            const LOCATION = this.event.location;
            const vcalendarDataHeader = [
                "BEGIN:VCALENDAR",
                "VERSION:2.0",
                "PRODID:jewCal/1.0",
                "CALSCALE:GREGORIAN",
                "METHOD:PUBLISH",
            ];
            const vcalendarDataBody = []
            const RDATE = arrayOfDatesToRDATE(this.occurrencesGeorgianDated);
            // loop through georgian dates and create ical events

            const startDate = format(this.occurrencesGeorgianDated[0], "yyyyMMdd");
            const uuid = uuidv4();
            const dataItem = [
                "BEGIN:VEVENT",
                `UID:${uuid}`,
                `DTSTART;VALUE=DATE:${startDate}`,
                `DTEND;VALUE=DATE:${startDate}`,
                `DTSTAMP:${startDate}T100000Z`,
                `SUMMARY:${SUMMARY}`,
                `LOCATION:${LOCATION}`,
                `DESCRIPTION:${DESCRIPTION}`,
                `${RDATE}`,
                "END:VEVENT",
            ]

            vcalendarDataBody.push(...dataItem);

            const vcalendarDataFooter = [
                "END:VCALENDAR",
            ];

            // combine all data
            let data = [...vcalendarDataHeader, ...vcalendarDataBody, ...vcalendarDataFooter];
            // add new line to each item
            data = data.map((item) => item + '\n');

            console.log(data)
            const blob = new Blob(data, {
                type: "text/plain;charset=utf-8"
            });
            saveAs(blob, "cal.ics");

        },

        // async googleSignInClicked() {
        //     console.log("googleSignInClicked");
        //     const data = await handleAuthClick()
        //     console.log(data);
        //     await this.$nextTick();
        // },
        // isSignedIn() {
        //     console.log("isSignedIn", isSignedIn());
        //     return isSignedIn();
        // },
        async insertEvents() {
            try {
                if (!gCalApi.isSignedIn()) {
                    await gCalApi.handleAuthClick()
                }
                if (!gCalApi.isSignedIn()) {
                    return alert("Please give permission to store events in your Google Calendar")
                }
                const id = uuidv4();
                this.event.recurringEventId = id;
                // for (const date of this.occurrencesGeorgianDated) {
                await gCalApi.insertEvent(this.occurrencesGeorgianDated, this.event)
                alert("נשמר ביומן גוגל");
                // }
            } catch (e) {
                console.log(e);
            }
        },
        _initData() {
            // clone the object
            const jewishDate = {
                ...this.jewDate
            }
            // create 120 jewish years and store to array
            for (let i = jewishDate.year; i < jewishDate.year + 120; i++) {
                // const hebJewDate = toHebrewJewishDate(jewishDate)
                this.FORM_DATA.YEARS.push({
                    id: i,
                    text: gematriya(i)
                });
            }
            this.FORM_DATA.MONTHS = jdc.getJewishMonths(this.jewDate.year, true);
            this.FORM_DATA.DAYS = [...Array(30).keys()].map((i) => {
                return {
                    id: i + 1,
                    text: gematriya(i + 1)
                }
            });

        }

    },
    computed: {
        shortDateToDate() {
            return new Date(this.startDate)
        },
    },
    async mounted() {

        this.createFutureDates()
        this._initData();
        console.log("init gapi");
        gCalApi.initClient().then(async () => {
            console.log("gapi inited");
            if (gCalApi.isSignedIn()) {
                console.log("gapi is signed in");
                // console.log(await gCalApi.getUserInfo());
            }
        })

        console.log(jdc.getJewishMonth(new Date()));

    },
    components: {
        IonItem,
        IonLabel,
        IonInput,
        IonNote,
        IonTextarea,
        IonIcon
    },
    setup() {
        return {
            logoGoogle,
            document
        }
    }

})
</script>

<style scoped>
    </style>
