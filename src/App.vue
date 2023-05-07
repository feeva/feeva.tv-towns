<template>
  <div ref="map" id="map"></div>

  <div v-if="loading" id="page-loader" class="page-loader">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
    <p class="mt-4">데이터 로딩 중...</p>
  </div>
  
  <div id="divInfoTouch"></div>
  <div id="divInfo">
    <div class="animated swing"><h1>TV 동네 탐방</h1></div>
    <div class="desc">
      <p>TV 방송 맛집, 멋집 지도로 찾기 (<span id="spanUpdated">2023-05-07</span>)</p>
    </div>
    <div class="finePrint">
      <p>이 페이지는 개인적인 TV 방송 시청자로서
          제작한 웹페이지이며 사용된 데이터는
          각각의 원 소유주에게 원래의 권한이 있습니다.</p>
      <p style="text-align: center;">(c) 2017-2023, <a href="http://feeva.github.io/" target="_blank">이동련</a></p>
    </div>
  </div>

</template>

<script>
import 'leaflet';
import 'leaflet.markercluster';

import { formatDate } from './utils';

let currLocation;

export default {
  data() {
    return {
      loading: false,
    };
  },

  created() {
    window.navigator.geolocation.getCurrentPosition(pos => {
      currLocation = [pos.coords.latitude, pos.coords.longitude];
      if (this.map) {
        this.map.setView(currLocation, 15);
      }
    });
  },

  async mounted() {
    const hide = () => {
      document.querySelectorAll('#divInfoTouch, #divInfo').forEach(el => el.style.display = 'none');
    }
    document.querySelectorAll('#divInfoTouch, #divInfo').forEach(el => {
      el.addEventListener('mousedown', hide);
      el.addEventListener('touchdown', hide);
    });

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

    this.loading = true;
    const arr = await Promise.all([
      import('./data/masters.json'),
      import('./data/meals.json'),
      import('./data/today.json'),
      import('./data/tonight.json'),
    ]);
    this.loading = false;

    const datasets = [
      { data: arr[0].default, name: '생활의 달인', icon: { html: '달인', iconSize: [36, 20], popupAnchor: [0, -10] }, },
      { data: arr[1].default, name: '백반기행', icon: { html: '백반', iconSize: [36, 20], popupAnchor: [0, -10] }, },
      { data: arr[2].default, name: '생방송 투데이', icon: { html: '투데이', iconSize: [48, 20], popupAnchor: [0, -10] }, },
      { data: arr[3].default, name: '생방송 오늘 저녁', icon: { html: '저녁', iconSize: [36, 20], popupAnchor: [0, -10] }, },
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
      setTimeout(() => {
        const el = document.querySelector('.highlight');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
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
  max-height: 200px; overflow-y: auto; word-break: break-all;
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

#page-loader {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  z-index: 900;
}
#page-loader .spinner-border { width: 4rem; height: 4rem; border-width: .4em; }

#divInfo {
    position: absolute; left: 0; top: 0; right: 0; bottom: 0;
    width: 400px; max-width: 95%; height: 220px;
    margin: auto; padding: 1em; box-sizing: border-box;
    background-color: white; border: solid 1px #ccc; border-radius: 5px;
    box-shadow: #555 5px 5px 20px; z-index: 999;
}
#divInfo h1 {
    margin: 0;
    color: #f35626; font-weight: 700; font-size: 3.6em;
    background-image: -webkit-linear-gradient(0deg,#f35626,#feab3a);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: hue 8s infinite linear;
}
@keyframes hue {
  from {
    filter: hue-rotate(0deg);
  }

  to {
    filter: hue-rotate(-360deg);
  }
}
#divInfo .finePrint { font-size: 9pt; color: #aaa; }
#divInfoTouch { position: absolute; left: 0; top: 0; right: 0; bottom: 0; z-index: 999; background-color: white; opacity: 0; }
</style>
