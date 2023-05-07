<template>
  <div ref="map" id="map"></div>
</template>

<script>
import 'leaflet';
import 'leaflet.markercluster';

import mastersData from './data/masters.json';
import mealsData from './data/meals.json';
import todayData from './data/today.json';
import tonightData from './data/tonight.json';
import { formatDate } from './utils';

let currLocation;

export default {
  created() {
    window.navigator.geolocation.getCurrentPosition(pos => {
      currLocation = [pos.coords.latitude, pos.coords.longitude];
      if (this.map) {
        this.map.setView(currLocation, 15);
      }
    });
  },

  mounted() {
    const TILE_URLS = {
      BASE: 'https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png',
    };
    const VWORLD_ATTRIBUTION = '&copy; <a href="http://www.vworld.kr/po_main.do" target="_blank">공간정보 오픈플랫폼</a>'
      + ' | <a href="http://www.molit.go.kr/" target="_blank">국토교통부</a>';
    const L = window.L;

    this.map = L.map('map', {
      maxZoom: 18,
      minZoom: 7,
      maxBounds: [[31, 122], [40, 134]],
      zoomControl: false,
    });
    L.tileLayer(TILE_URLS.BASE, {
      attribution: VWORLD_ATTRIBUTION,
    }).addTo(this.map);

    if (currLocation) {
      this.map.setView(currLocation, 15);
    } else {
      this.map.fitBounds([[32.5, 125], [39, 130.5]]);
    }

    const markers = L.markerClusterGroup({
      maxClusterRadius: 50,
    });

    const datasets = [
      { data: mastersData, name: '생활의 달인', icon: { html: '달인', iconSize: [36, 20], popupAnchor: [0, -10] }, },
      { data: mealsData, name: '백반기행', icon: { html: '백반', iconSize: [36, 20], popupAnchor: [0, -10] }, },
      { data: todayData, name: '생방송 투데이', icon: { html: '투데이', iconSize: [48, 20], popupAnchor: [0, -10] }, },
      { data: tonightData, name: '생방송 오늘 저녁', icon: { html: '저녁', iconSize: [36, 20], popupAnchor: [0, -10] }, },
    ];

    const popup = L.popup({
      maxWidth: 310,
    }).setContent(marker => {
      const { dataset, item, address } = marker.__data;
      const body = item.body
        .replace(/\n/g, '<br>')
        .replace(address, `<span class="highlight">${address}</span>`);

      return `
        <div><h3 class="h5">${datasets[dataset].name} ${formatDate(item.date)}</h3></div>
        <div class="popup__body">${body}</div>
      `
    });

    function scrollToHighlight() {
      const el = document.querySelector('.highlight');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    const now = Date.now()

    datasets.forEach((dataset, idx) => {
      Object.values(dataset.data).forEach(item => {
        const d = new Date(item.date.slice(0, 10));
        const yearDiff = Math.round((now - d.getTime()) / 1000 / 60 / 60 / 24 / 365);

        item.locations.forEach(loc => {
          const marker = L.marker([loc.lat, loc.lng], {
            icon: L.divIcon({ ...datasets[idx].icon, className: `badge badge-${idx} year-${yearDiff}`}),
            title: d.getFullYear() + '년, ' + loc.address,
            opacity: 8 / (yearDiff + 8),
          });
          marker.__data = { dataset: idx, item, address: loc.address };
          marker.bindPopup(popup).on('popupopen', scrollToHighlight)
          markers.addLayer(marker);
        });
      })
      this.map.addLayer(markers);
    });
  },
}
</script>

<style>
#map {
  width: 100vw; height: 100vh;
}

.leaflet-popup-content {
    margin: 13px 20px;
}

.popup__body {
  max-height: 200px; overflow-y: auto;
}
.highlight {
  background-color: #ff0;
}

.leaflet-marker-icon.badge { padding: 0.35em; font-size: 12px; font-weight: normal; }
.leaflet-marker-icon.badge-0 { background-color: #0086cd; }
.leaflet-marker-icon.badge-1 { background-color: #f54643; }
.leaflet-marker-icon.badge-2 { background-color: #0086cd; }
.leaflet-marker-icon.badge-3 { background-color: #040707; }

.leaflet-marker-icon.year-1 { filter: grayscale(5%); }
.leaflet-marker-icon.year-2 { filter: grayscale(10%); }
.leaflet-marker-icon.year-3 { filter: grayscale(18%); }
.leaflet-marker-icon.year-4 { filter: grayscale(30%); }
.leaflet-marker-icon.year-5 { filter: grayscale(45%); }
.leaflet-marker-icon.year-6 { filter: grayscale(65%); }
.leaflet-marker-icon.year-7 { filter: grayscale(90%); }
</style>
