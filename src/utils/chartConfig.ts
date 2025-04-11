import {
  Chart,
  registerables
} from 'chart.js';

// Chart.jsをグローバルに登録（すべてのコントローラーとスケールを含む）
Chart.register(...registerables);

export default Chart; 