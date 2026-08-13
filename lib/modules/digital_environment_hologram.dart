import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentHologramModule extends StatefulWidget {
  const DigitalEnvironmentHologramModule({super.key});

  @override
  State<DigitalEnvironmentHologramModule> createState() => _DigitalEnvironmentHologramModuleState();
}

class _DigitalEnvironmentHologramModuleState extends State<DigitalEnvironmentHologramModule> {
  String _activeTheme = 'Cyberpunk Neon Blue';
  double _glowIntensity = 0.85;
  bool _scanlinesActive = true;
  String _hologramStatus = 'Holografinen projektio aktiivinen: Win96 CRT-efektit päällä.';

  void _switchTheme(String themeName) {
    setState(() {
      _activeTheme = themeName;
      _hologramStatus = 'Vaihdettu teemaksi: $themeName (Spektri optimoitu).';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              '🔮 Spacemonkey Holographic UI & Theme Deck',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _activeTheme,
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: Colors.white.withOpacity(0.2)),
          ),
          child: Text(
            _hologramStatus,
            style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
          ),
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.white.withOpacity(0.15)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('Holografinen hehku (Glow Intensity)', style: TextStyle(color: Colors.white, fontSize: 12)),
                const SizedBox(height: 8),
                ProgressBar(value: _glowIntensity * 100),
                const SizedBox(height: 20),
                const Text('Valitse holografinen teema:', style: TextStyle(color: Colors.grey, fontSize: 11)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    Button(
                      onPressed: () => _switchTheme('Cyberpunk Neon Blue'),
                      child: const Text('Neon Blue'),
                    ),
                    Button(
                      onPressed: () => _switchTheme('Matrix Phosphor Green'),
                      child: const Text('Phosphor Green'),
                    ),
                    Button(
                      onPressed: () => _switchTheme('Retro Amber 1996'),
                      child: const Text('Retro Amber'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        ToggleSwitch(
          checked: _scanlinesActive,
          content: const Text('CRT Scanlines -tehoste', style: TextStyle(color: Colors.white, fontSize: 12)),
          onChanged: (val) {
            setState(() {
              _scanlinesActive = val;
            });
          },
        ),
      ],
    );
  }
}
