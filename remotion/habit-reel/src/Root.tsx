import { Composition } from "remotion";
import { HabitReel } from "./HabitReel";
import { FPS, HEIGHT, WIDTH } from "./scenes";
import { DURATION_IN_FRAMES } from "./timing";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="HabitReel"
    component={HabitReel}
    durationInFrames={DURATION_IN_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);
