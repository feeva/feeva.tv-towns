<template>
  <div ref="map" id="map"></div>

  <div id="filter-form">
    <div class="row">
      <div class="col">
        <input
          class="form-control"
          type="text"
          placeholder="방송 주소 검색"
          :value="addressSearchText"
          @input="addressSearchText = $event.target.value.trim()"
        >
        <button v-if="addressSearchText" type="button" class="btn-close" @click="addressSearchText = ''"></button>
      </div>
      <div class="col">
        <input
          class="form-control"
          type="text"
          placeholder="방송 내용 검색"
          :value="contentSearchText"
          @input="contentSearchText = $event.target.value.trim()"
        >
        <button v-if="contentSearchText" type="button" class="btn-close" @click="contentSearchText = ''"></button>
      </div>
    </div>
  </div>

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
      <p>최근 5년간 TV 방송 맛집, 멋집 찾기 (<span id="spanUpdated">2023-05-20</span>)</p>
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

import { formatDate, debounce } from './utils';
import { findAddresses } from '../scripts/functions.mjs';

let currLocation;

export default {
  data() {
    return {
      loading: false,
      addressSearchText: '',
      contentSearchText: '',
    };
  },

  watch: {
    addressSearchText() {
      this.debouncedShowMarkers();
    },
    contentSearchText() {
      this.debouncedShowMarkers();
    },
  },

  created() {
    window.navigator.geolocation?.getCurrentPosition(pos => {
      currLocation = [pos.coords.latitude, pos.coords.longitude];
      if (this.map) {
        this.map.setView(currLocation, 15);
      }
    });
  },

  async mounted() {

    // initialize events for info div
    const hide = () => {
      document.querySelectorAll('#divInfoTouch, #divInfo').forEach(el => el.style.display = 'none');
    }
    document.querySelectorAll('#divInfoTouch, #divInfo').forEach(el => {
      el.addEventListener('click', hide);
    });

    // initialize map
    const TILE_URLS = {
      BASE: 'https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png',
    };
    const VWORLD_ATTRIBUTION = '&copy; <a href="http://www.vworld.kr/po_main.do" target="_blank">공간정보 오픈플랫폼</a>'
      + ' | <a href="http://www.molit.go.kr/" target="_blank">국토교통부</a>';
    const L = window.L;

    this.map = L.map(this.$refs.map, {
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

    // initialize markers
    this.datasets = {
      masters: { name: '생활의 달인', icon: { html: '달인', iconSize: [36, 20], popupAnchor: [0, -10] }, },
      meals: { name: '백반기행', icon: { html: '백반', iconSize: [36, 20], popupAnchor: [0, -10] }, },
      today: { name: '생방송 투데이', icon: { html: '투데이', iconSize: [48, 20], popupAnchor: [0, -10] }, },
      tonight: { name: '생방송 오늘 저녁', icon: { html: '저녁', iconSize: [36, 20], popupAnchor: [0, -10] }, },
    };

    this.popup = L.popup({
      maxWidth: 310,
    }).setContent(marker => {
      const { dataset, item, address, locations } = marker.__data;

      let body = item.body
                .replaceAll(item.title, '').trim()
                .replaceAll('<', '&lt;')
                .replaceAll('\n', '<br>')
                .replaceAll(address, `<span class="highlight">${address}</span>`)
                .replace(/(https?:\/\/[\w가-힣/%_\-+=?&.#@]+)/g, '<a href="$1" target="_blank">$1</a>');

      const addresses = findAddresses(body);
      addresses.forEach(a => {
        if (locations[a] && a !== address)
          body = body.replaceAll(a, `<a href="#move" data-loc="${locations[a].lat},${locations[a].lng}">${a}</a>`);
      });

      return `
        <div><h3 class="h5">${this.datasets[dataset].name} ${formatDate(item.date)}</h3></div>
        <div class="popup__body">
          <p><strong>${item.title}</strong></p>
          ${body}
        </div>
      `
    });

    document.addEventListener('click', e => {
      if (e.target.matches('a[data-loc]')) {
        e.preventDefault();
        const latLng = e.target.dataset.loc.split(',');
        this.map.flyTo(latLng, Math.max(16, this.map.getZoom()));
      }
    });

    this.markers = L.markerClusterGroup({ maxClusterRadius: zoom => -7 * zoom + 156 });
    this.map.addLayer(this.markers);

    // load data
    this.loading = true;
    const arr = await Promise.all([import('./data/posts.json'), import('./data/locations.json')]);
    const posts = arr[0].default;
    const locations = arr[1].default;
    this.loading = false;

    const now = Date.now()
    this.markerArr = [];

    Object.keys(posts).forEach(key => {
      const item = posts[key];
      const datasetId = key.split('-')[0];
      const date = item.date.slice(0, 10);
      const yearDiff = Math.round((now - new Date(date).getTime()) / 1000 / 60 / 60 / 24 / 365);
      const addresses = findAddresses(item.body);

      addresses.forEach(address => {
        const loc = locations[address];
        if (!loc) return;

        const marker = window.L.marker([loc.lat, loc.lng], {
          icon: window.L.divIcon({ ...this.datasets[datasetId].icon, className: `badge badge-${datasetId} year-${yearDiff}`}),
          title: `${date} ${this.datasets[datasetId].name}, ${address}`,
          opacity: 7 / (yearDiff + 7),
        });
        marker.__data = { dataset: datasetId, item, address, locations };
        marker.bindPopup(this.popup).on('popupopen', this.scrollToHighlight)
        this.markerArr.push(marker);
      });
    });
    
    this.debouncedShowMarkers = debounce(this.showMarkers);
    this.showMarkers();
  },

  methods: {
    scrollToHighlight() {
      setTimeout(() => {
        const el = document.querySelector('.highlight');
        if (el) {
          el.scrollIntoView({ block: 'center' });
        }
      });
    },

    showMarkers() {
      const addressSearch = this.addressSearchText.toLowerCase();
      const contentSearch = this.contentSearchText.toLowerCase();

      const filtered = addressSearch || contentSearch ? this.markerArr.filter(m => {
        const { item, address } = m.__data;
        return (!addressSearch || address.toLowerCase().includes(addressSearch))
          && (
            !contentSearch
            || item.title.toLowerCase().includes(contentSearch)
            || item.body.toLowerCase().includes(contentSearch)
          )

      }) : this.markerArr;

      this.markers.clearLayers();
      this.markers.addLayers(filtered);
    }
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
.leaflet-marker-icon.badge-masters { background-color: #0086cd; }
.leaflet-marker-icon.badge-meals { background-color: #f54643; }
.leaflet-marker-icon.badge-today { background-color: #0086cd; }
.leaflet-marker-icon.badge-tonight { background-color: #040707; }

.leaflet-marker-icon[class^="year-"] { filter: grayscale(100%); }
.leaflet-marker-icon.year-0 { filter: grayscale(0); }
.leaflet-marker-icon.year-1 { filter: grayscale(5%); }
.leaflet-marker-icon.year-2 { filter: grayscale(15%); }
.leaflet-marker-icon.year-3 { filter: grayscale(30%); }
.leaflet-marker-icon.year-4 { filter: grayscale(50%); }
.leaflet-marker-icon.year-5 { filter: grayscale(75%); }

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

#filter-form {
  position: fixed;
  top: .5rem;
  left: .5rem;
  z-index: 900;
  width: 340px;
  max-width: 90%;
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: 5px;
  padding: 0.5rem 1rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}
#filter-form .col { position: relative; }
.btn-close {
  position: absolute;
  top: .5rem;
  right: 1rem;
}

#divInfo {
    position: absolute; left: 0; top: 0; right: 0; bottom: 0;
    width: 400px; max-width: 95%; height: 220px;
    margin: auto; padding: 1em; box-sizing: border-box;
    background-color: white; border: solid 1px #ccc; border-radius: 5px;
    box-shadow: #555 5px 5px 20px; z-index: 999;
}
#divInfo h1 {
    margin: 0; text-align: center;
    color: #f35626; font-weight: 700; font-size: 3.6em;
    background-image: -webkit-linear-gradient(0deg,#f35626,#feab3a);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: hue 8s infinite linear;
}
#divInfo .desc { text-align: center; }
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
