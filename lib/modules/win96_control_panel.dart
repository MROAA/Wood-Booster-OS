import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96ControlPanelModule extends StatefulWidget {
  const Win96ControlPanelModule({super.key});

  @override
  State<Win96ControlPanelModule> createState() => _Win96ControlPanelModuleState();
}

class _Win96ControlPanelModuleState extends State<Win96ControlPanelModule> {
  String _activeTheme = 'Chicago Classic 96';
  bool _soundEnabled = true;
  double _cursorSpeed = 5.0;

  void _applyTheme(String themeName) {
    setState(() {
      _activeTheme = themeName;
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
              '🎨 Win96 Control Panel / Appearance',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Teema: $_activeTheme',
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
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
              children: [
                const Text('Työpöydän teemat:', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    Button(
                      onPressed: () => _applyTheme('Chicago Classic 96'),
                      child: const Text('Classic 96'),
                    ),
                    Button(
                      onPressed: () => _applyTheme('Wood-Booster Amber'),
                      child: const Text('Amber'),
                    ),
                    Button(
                      onPressed: () => _applyTheme('Midnight Blue'),
                      child: const Text('Midnight'),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Järjestelmä-äänet (Chimes)', style: TextStyle(color: Colors.white, fontSize: 12)),
                    ToggleSwitch(
                      checked: _soundEnabled,
                      onChanged: (val) {
                        setState(() {
                          _soundEnabled = val;
                        });
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                const Text('Hiiren osoittimen nopeus:', style: TextStyle(color: Colors.white, fontSize: 12)),
                const SizedBox(height: 8),
                Slider(
                  value: _cursorSpeed,
                  min: 1.0,
                  max: 10.0,
                  onChanged: (val) {
                    setState(() {
                      _cursorSpeed = val;
                    });
                  },
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
