import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96DesktopManagerModule extends StatefulWidget {
  const Win96DesktopManagerModule({super.key});

  @override
  State<Win96DesktopManagerModule> createState() => _Win96DesktopManagerModuleState();
}

class _Win96DesktopManagerModuleState extends State<Win96DesktopManagerModule> {
  String _desktopStatus = 'Desktop Manager aktiivinen: Kaikki työpöydän alijärjestelmät ja linkit valmiina.';
  
  final List<Map<String, dynamic>> _desktopShortcuts = [
    {'title': 'Oma Tietokone', 'icon': '💻', 'module': 'File Explorer', 'active': true},
    {'title': 'Ohjauspaneeli', 'icon': '⚙️', 'module': 'Control Panel', 'active': true},
    {'title': 'Muistio (Notepad)', 'icon': '📝', 'module': 'Notepad', 'active': true},
    {'title': 'Taskbar & Start', 'icon': '🖥️', 'module': 'Taskbar Shell', 'active': true},
    {'title': 'Spacemonkey Matrix', 'icon': '🌌', 'module': 'Omniversal Core', 'active': true},
    {'title': 'Kiertoprosessori', 'icon': '⚡', 'module': 'Quantum Boost', 'active': false},
  ];

  void _launchApp(String title) {
    setState(() {
      _desktopStatus = 'Käynnistetty sovellus: $title ladataan nollaviiveellä (Zero-Latency)...';
    });
  }

  void _toggleShortcut(int index) {
    setState(() {
      _desktopShortcuts[index]['active'] = !_desktopShortcuts[index]['active'];
      final name = _desktopShortcuts[index]['title'];
      final status = _desktopShortcuts[index]['active'] ? 'aktivoitu työpöydälle' : 'piilotettu';
      _desktopStatus = 'Kuvake "$name" $status.';
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
              '🖥️ Win96 Desktop Manager & Front-End Link Shell',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Aktiivisia sovelluksia: ${_desktopShortcuts.where((s) => s['active']).length}',
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
            _desktopStatus,
            style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
          ),
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF008080), // Klassinen Win96 Teal-tausta
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: Colors.white.withOpacity(0.3), width: 2),
            ),
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: GridView.builder(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 1.3,
                ),
                itemCount: _desktopShortcuts.length,
                itemBuilder: (context, index) {
                  final shortcut = _desktopShortcuts[index];
                  final bool isActive = shortcut['active'];
                  
                  if (!isActive) return const SizedBox.shrink();

                  return GestureDetector(
                    onTap: () => _launchApp(shortcut['title']),
                    onDoubleTap: () => _toggleShortcut(index),
                    child: Container(
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
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(shortcut['icon'], style: const TextStyle(fontSize: 24)),
                          const SizedBox(height: 6),
                          Text(
                            shortcut['title'],
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Colors.black,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            shortcut['module'],
                            style: TextStyle(
                              color: Colors.grey[700],
                              fontSize: 8,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Button(
              onPressed: () {
                setState(() {
                  for (var s in _desktopShortcuts) {
                    s['active'] = true;
                  }
                  _desktopStatus = 'Kaikki työpöydän linkit palautettu näkyviin.';
                });
              },
              child: const Text('Palauta kaikki kuvakkeet'),
            ),
            Button(
              onPressed: () {
                setState(() {
                  _desktopStatus = 'Työpöydän välimuisti tyhjennetty ja grafiikkapohja päivitetty.';
                });
              },
              child: const Text('Päivitä työpöytäbufferi'),
            ),
          ],
        ),
      ],
    );
  }
}
