import { freezed } from '../../../packages/freezedts/src/runtime/freezed.ts';
import type { Shade, Finish } from './generated/palette.ts';
import { Pigment } from './pigment.ts';
import { $Stroke, $Canvas } from './canvas.freezed.ts';

@freezed()
class Stroke extends $Stroke {
  constructor(params: {
    width: number;
    pigments: Pigment[];
    shade: Shade;
  }) {
    super(params);
  }
}

@freezed()
class Canvas extends $Canvas {
  constructor(params: {
    title: string;
    finish: Finish;
    strokes: Stroke[];
    layers: Pigment[];
    highlight: Stroke | null;
  }) {
    super(params);
  }
}

export { Stroke, Canvas };
