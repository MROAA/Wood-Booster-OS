import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96EngineModule extends StatefulWidget {
  const Win96EngineModule({super.key});

  @override
  State<Win96EngineModule> createState() => _Win96EngineModuleState();
}

class _Win96EngineModuleState extends State<Win96EngineModule> {
  String _registryStatus = 'HKEY_CURRENT_USER\Control Panel\Desktop -> Vakaa';
  bool _turboMode = true;
  String _synthLog = 'Win96 Audio Engine valmiina.';

  void _tweakRegistry(String keyPath, String value) {
    setState(() {
      _registryStatus = 'Muokattu: $keyPath = $value';
    });
  }

  void _triggerSynth(String soundType) {
    setState(() {
      if (soundType == 'startup') {
        _synthLog = '🔊 *Win96 Startup Chimes* soitettu (MIDI Synthesizer)';
      } else if (soundType == 'error') {
        _synthLog = '⚠️ *Critical Stop* -ääniefekti laukaistu (Beep!)';
      } else if (soundType == 'click') {
        _synthLog = '🖱️ *UI Click* -signaali rekisteröity.';
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '⚙️ Win96 Registry & Audio Engine Core',
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
        ),
        const SizedBox(height: 12),
        // Rekisteri / System Engine -paneeli
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFF1E1E1E),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: Colors.white.withOpacity(0.15)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Registry Engine (regedit.exe):', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(_registryStatus, style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace')),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Turbo Boost Mode', style: TextStyle(color: Colors.white, fontSize: 12)),
                  ToggleSwitch(
                    checked: _turboMode,
                    onChanged: (val) {
                      setState(() {
                        _turboMode = val;
                        _tweakRegistry('HKEY_LOCAL_MACHINE\Turbo', val ? 'ENABLED' : 'DISABLED');
                      });
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          '🎹 Win96 Sound Synthesizer Engine',
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: Colors.white.withOpacity(0.2)),
          ),
          child: Text(
            _synthLog,
            style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12, fontFamily: 'monospace'),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Button(
              onPressed: () => _triggerSynth('startup'),
              child: const Text('Soita Startup'),
            ),
            Button(
              onPressed: () => _triggerSynth('error'),
              child: const Text('Virheääni (Beep)'),
            ),
            Button(
              onPressed: () => _triggerSynth('click'),
              child: const Text('Napsauta'),
            ),
          ],
        ),
      ],
    );
  }
}
