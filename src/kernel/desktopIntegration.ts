import { mythosScroller } from './mythosScroller';
import { masterPipeline } from './masterEndToEndPipeline';

export class DesktopIntegration {
  public initializeDesktopModules(): void {
    console.log('🖥️ [DESKTOP INTEGRATION] Ladataan C++ paneelit työpöydälle...');
    masterPipeline.executeFullSystemBoot();
    mythosScroller.addLog('Desktop_Manager', 'Kaikki C++ turva-, kvantti- ja ydinpaneelit renderöity työpöydälle.');
  }
}

export const desktopIntegration = new DesktopIntegration();
