import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96TaskbarStartMenuModule extends StatefulWidget {
  const Win96TaskbarStartMenuModule({super.key});

  @override
  State<Win96TaskbarStartMenuModule> createState() => _Win96TaskbarStartMenuModuleState();
}

class _Win96TaskbarStartMenuModuleState extends State<Win96TaskbarStartMenuModule> {
  bool _startMenuOpen = false;
  bool _soundEnabled = true;
  String _trayStatus = 'Win96 Taskbar & Start Menu aktiivinen.';

  final List<String> _startMenuItems = [
    '📁 Ohjelmat (Programs)',
    '⚙️ Asetukset (Settings)',
    '🔍 Etsi (Find)',
    '❓ Ohje (Help)',
    '🚪 Sulje järjestelmä (Shut Down)',
  ];

  void _toggleStartMenu() {
    setState(() {
      _startMenuOpen = !_startMenuOpen;
      _trayStatus = _startMenuOpen ? 'Start-valikuva avattu.' : 'Start-valikuva suljettu.';
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
              '🖥️ Win96 Taskbar & Start Menu Shell',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _startMenuOpen ? 'Valikko: Auki' : 'Valikko: Kiinni',
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
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: Colors.white.withOpacity(0.2)),
          ),
          child: Text(
            _trayStatus,
            style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
          ),
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF005555),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: Colors.white.withOpacity(0.3), width: 2),
            ),
            child: Stack(
              children: [
                // Simuloitu työpöytätila
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'Win96 Työpöytäympäristö',
                        style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Paina alla olevaa Start-painiketta avataksesi valikon.',
                        style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 11),
                      ),
                    ],
                  ),
                ),
                
                // Avautuva Start-valikko simulaatio
                if (_startMenuOpen)
                  Positioned(
                    bottom: 38,
                    left: 4,
                    child: Container(
                      width: 180,
                      decoration: BoxDecoration(
                        color: const Color(0xFFC0C0C0),
                        border: Border(
                          top: BorderSide(color: Colors.white, width: 2),
                          left: BorderSide(color: Colors.white, width: 2),
                          right: BorderSide(color: Colors.black, width: 2),
                          bottom: BorderSide(color: Colors.black, width: 2),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                            color: const Color(0xFF000080),
                            child: const Row(
                              children: [
                                Text('Win', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                                Text('96', style: TextStyle(color: Color(0xFFC0C0C0), fontWeight: FontWeight.bold, fontSize: 12)),
                              ],
                            ),
                          ),
                          ..._startMenuItems.map((item) => Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                            child: Text(
                              item,
                              style: const TextStyle(color: Colors.black, fontSize: 10),
                            ),
                          )),
                        ],
                      ),
                    ),
                  ),

                // Win96 Alapalkki (Taskbar)
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Container(
                    height: 34,
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFC0C0C0),
                      border: Border(
                        top: BorderSide(color: Colors.white, width: 2),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Start-painike
                        GestureDetector(
                          onTap: _toggleStartMenu,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFC0C0C0),
                              border: Border(
                                top: BorderSide(color: Colors.white, width: 1.5),
                                left: BorderSide(color: Colors.white, width: 1.5),
                                right: BorderSide(color: Colors.black, width: 1.5),
                                bottom: BorderSide(color: Colors.black, width: 1.5),
                              ),
                            ),
                            child: const Row(
                              children: [
                                Text('🪟', style: TextStyle(fontSize: 10)),
                                SizedBox(width: 4),
                                Text(
                                  'Start',
                                  style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                        ),
                        // Järjestelmän kello / Tray
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                          decoration: BoxDecoration(
                            border: Border(
                              top: BorderSide(color: Colors.black, width: 1),
                              left: BorderSide(color: Colors.black, width: 1),
                              right: BorderSide(color: Colors.white, width: 1),
                              bottom: BorderSide(color: Colors.white, width: 1),
                            ),
                          ),
                          child: const Text(
                            '16:37',
                            style: TextStyle(color: Colors.black, fontSize: 10, fontFamily: 'monospace'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Button(
              onPressed: _toggleStartMenu,
              child: const Text('Vaihda Start-valikon tilaa'),
            ),
            ToggleSwitch(
              checked: _soundEnabled,
              content: const Text('Käynnistysäänet', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _soundEnabled = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
