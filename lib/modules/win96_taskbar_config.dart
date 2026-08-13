import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96TaskbarConfigModule extends StatefulWidget {
  const Win96TaskbarConfigModule({super.key});

  @override
  State<Win96TaskbarConfigModule> createState() => _Win96TaskbarConfigModuleState();
}

class _Win96TaskbarConfigModuleState extends State<Win96TaskbarConfigModule> {
  bool _autoHide = false;
  bool _showClock = true;
  bool _smallIcons = true;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              '🎛️ Win96 Taskbar & Start Menu Properties',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _autoHide ? 'Piilotettu' : 'Aktiivinen',
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
                const Text('Tehtäväpalkin asetukset:', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Piilota tehtäväpalkki automaattisesti (Auto-hide)', style: TextStyle(color: Colors.white, fontSize: 12)),
                    ToggleSwitch(
                      checked: _autoHide,
                      onChanged: (val) {
                        setState(() {
                          _autoHide = val;
                        });
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Näytä kello ilmaisinalueella (Taskbar Clock)', style: TextStyle(color: Colors.white, fontSize: 12)),
                    ToggleSwitch(
                      checked: _showClock,
                      onChanged: (val) {
                        setState(() {
                          _showClock = val;
                        });
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Käytä pieniä kuvakkeita Käynnistysvalikossa', style: TextStyle(color: Colors.white, fontSize: 12)),
                    ToggleSwitch(
                      checked: _smallIcons,
                      onChanged: (val) {
                        setState(() {
                          _smallIcons = val;
                        });
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
