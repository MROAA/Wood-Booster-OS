export interface VisualStatus {
  theme: string;
  resolution: string;
  renderMode: string;
  catchphrase: string;
}

export class Win96VisualLayer {
  private static instance: Win96VisualLayer;
  private theme: string = "Classic Chicago Grey (#C0C0C0)";
  private resolution: string = "640x480 (Upscaled to Infinite)";
  private renderMode: string = "Retro-Vector";
  private catchphrase: string = "Win96: Harmaa on uusi musta, pikselit ovat ikuisia!";

  private constructor() {
    console.log(`[Win96VisualLayer] Visuaalinen renderöintimoottori alustettu.`);
  }

  public static getInstance(): Win96VisualLayer {
    if (!Win96VisualLayer.instance) {
      Win96VisualLayer.instance = new Win96VisualLayer();
    }
    return Win96VisualLayer.instance;
  }

  public renderDesktop(): string {
    return `
    [================================================]
    | [My Computer]  [Recycle Bin]    [Win96 Dev]    |
    |                                                |
    |          Win96 Supreme OS v1.0                 |
    |          (c) Marc Järvinen                     |
    |                                                |
    | [Win96 Terminal]                               |
    | ______________________________________________ |
    | | C:\\> _                                     | |
    | |____________________________________________| |
    |                                                |
    [================================================]
    [ Start ]  System Status: 33 Layers Active...
    `;
  }

  public getStatus(): VisualStatus {
    return {
      theme: this.theme,
      resolution: this.resolution,
      renderMode: this.renderMode,
      catchphrase: this.catchphrase
    };
  }
}

export const win96Visuals = Win96VisualLayer.getInstance();
