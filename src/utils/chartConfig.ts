import {
  Chart,
  registerables
} from 'chart.js';

// Chart.jsをグローバルに登録
Chart.register(...registerables);

export default Chart; 