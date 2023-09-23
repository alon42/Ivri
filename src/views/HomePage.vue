<template>
  <ion-page>
    <ion-header :translucent="true" class="">
      <ion-toolbar>
        
        <ion-title size="large">
          <ion-icon :icon="calendarOutline"></ion-icon>
          עברי - תאריכים עבריים ליומן</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          
          <ion-title size="large">
            <ion-icon slot="start" :icon="calendarOutline"></ion-icon>
            עברי - תאריכים עבריים ליומן</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-grid>
        <ion-row>
          <ion-col></ion-col>
          <ion-col>
            <juCal></juCal>
          </ion-col>
          <ion-col></ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonRow, IonCol, IonGrid,IonIcon } from "@ionic/vue";
import juCal from "../components/juCal.vue";
import { calendarOutline } from "ionicons/icons";
</script>


<style scoped>
#container {
  text-align: center;

  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;

  color: #8c8c8c;

  margin: 0;
}

#container a {
  text-decoration: none;
}
</style>
