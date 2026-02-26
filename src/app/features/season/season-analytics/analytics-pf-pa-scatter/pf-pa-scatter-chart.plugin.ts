import type { Chart, Plugin } from 'chart.js';

export interface PfPaScatterPluginOptions {
  avgPF: number;
  avgPA: number;
  axisMin: number;
  axisMax: number;
}

function getOpts(chart: Chart): PfPaScatterPluginOptions | null {
  return (chart.options.plugins as Record<string, unknown>)?.['pfPaScatter'] as PfPaScatterPluginOptions | null;
}

/** Draws quadrant lines (league avg PF, league avg PA) and diagonal PF=PA (.500 line). */
export const pfPaScatterLinesPlugin: Plugin<'scatter'> = {
  id: 'pfPaScatterLines',
  afterDatasetsDraw(chart: Chart<'scatter'>) {
    const opts = getOpts(chart);
    if (!opts) return;
    const { ctx } = chart;
    const xScale = chart.scales['x'];
    const yScale = chart.scales['y'];
    if (!xScale || !yScale) return;

    const toX = (v: number) => xScale.getPixelForValue(v);
    const toY = (v: number) => yScale.getPixelForValue(v);

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';

    const { avgPF, avgPA, axisMin, axisMax } = opts;

    // Vertical: league avg PF
    ctx.beginPath();
    ctx.moveTo(toX(avgPF), toY(axisMin));
    ctx.lineTo(toX(avgPF), toY(axisMax));
    ctx.stroke();

    // Horizontal: league avg PA
    ctx.beginPath();
    ctx.moveTo(toX(axisMin), toY(avgPA));
    ctx.lineTo(toX(axisMax), toY(avgPA));
    ctx.stroke();

    // Diagonal: PF = PA (.500 line)
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.moveTo(toX(axisMin), toY(axisMin));
    ctx.lineTo(toX(axisMax), toY(axisMax));
    ctx.stroke();

    ctx.restore();
  },
};

/** Draws team abbreviation label next to each scatter point. */
export const pfPaScatterLabelsPlugin: Plugin<'scatter'> = {
  id: 'pfPaScatterLabels',
  afterDatasetsDraw(chart: Chart<'scatter'>) {
    const teamDataset = chart.data.datasets[0];
    if (!teamDataset?.data?.length) return;
    const { ctx } = chart;
    const xScale = chart.scales['x'];
    const yScale = chart.scales['y'];
    if (!xScale || !yScale) return;

    const meta = chart.getDatasetMeta(0);
    if (!meta?.data?.length) return;

    ctx.save();
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#333';

    meta.data.forEach((point, i) => {
      const raw = teamDataset.data[i] as { x: number; y: number; abbrev?: string };
      const abbrev = raw?.abbrev ?? '';
      if (!abbrev) return;
      const x = point['x'] + 6;
      const y = point['y'];
      ctx.fillText(abbrev, x, y);
    });

    ctx.restore();
  },
};
