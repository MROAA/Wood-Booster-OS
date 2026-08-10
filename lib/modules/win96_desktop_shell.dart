import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96DesktopShellModule extends StatefulWidget {
  const Win96DesktopShellModule({super.key});

  @override
  State<Win96DesktopShellModule> createState() => _Win96DesktopShellModuleState();
}

class _Win96DesktopShellModuleState extends State<Win96DesktopShellModule> {
  bool _classicAeroEnabled = true;
  double _windowOpacity = 1.0;
  String _shellStatus = 'Win96 Desktop Shell aktiivinen: Klassinen graafinen pohja valmiina.';
  
  final List<Map<String, String>> _activeWindows = [
    {'title': 'Oma Tietokone (My Computer)', 'status': 'Minimoitu', 'memory': '640 KB'},
    {'title': 'Ohjauspaneeli (Control Panel)', 'status': 'Aktiivinen', 'memory': '16 MB'},
    {'title': 'Spacemonkey Omniversal Terminal', 'status': 'Taustalla', 'memory': 'Infinity'},
  ];

  void _toggleShellMode() {
    setState(() {
      _classicAeroEnabled = !_classicAeroEnabled;
      _shellStatus = _classicAeroEnabled 
        ? 'Win96 Classic Aero -tila kytketty päälle.' 
        : 'Win96 Retro Basic -tila kytketty päälle.';
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
              '🗔 Win96 Desktop Shell & Window Manager',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _classicAeroEnabled ? 'Tila: Classic Aero' : 'Tila: Retro Basic',
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
            _shellStatus,
            style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
          ),
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF008080), // Klassinen Win96 Teal -taustaväri
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: Colors.white.withOpacity(0.3), width: 2),
            ),
            child: Column(
              children: [
                // Simuloitu ikkunan otsikkopalkki
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: const BoxDecoration(
                    color: Color(0xFF000080), // Klassinen tummansininen
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Win96 Graafinen Hallinta',
                        style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                      Row(
                        children: [
                          _buildWindowButton('_'),
                          const SizedBox(width: 2),
                          _buildWindowButton('□'),
                          const SizedBox(width: 2),
                          _buildWindowButton('X'),
                        ],
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: ListView.builder(
                      itemCount: _activeWindows.length,
                      itemBuilder: (context, index) {
                        final win = _activeWindows[index];
                        return Container(
                          margin: const EdgeInsets.only(bottom: 6),
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFC0C0C0), // Klassinen harmaa
                            border: Border(
                              top: BorderSide(color: Colors.white, width: 1.5),
                              left: BorderSide(color: Colors.white, width: 1.5),
                              right: BorderSide(color: Colors.black, width: 1.5),
                              bottom: BorderSide(color: Colors.black, width: 1.5),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                win['title']!,
                                style: const TextStyle(color: Colors.black, fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                              Text(
                                '${win['status']} (${win['memory']})',
                                style: const TextStyle(color: Color(0xFF000080), fontSize: 10, fontFamily: 'monospace'),
                              ),
                            ],
                          ),
                        );
                      },
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
              onPressed: _toggleShellMode,
              child: const Text('Vaihda Kuori-tilaa'),
            ),
            ToggleSwitch(
              checked: _classicAeroEnabled,
              content: const Text('Classic Aero -teema', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _classicAeroEnabled = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildWindowButton(String text) {
    return Container(
      width: 16,
      height: 16,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: const Color(0xFFC0C0C0),
        border: Border(
          top: BorderSide(color: Colors.white, width: 1),
          left: BorderSide(color: Colors.white, width: 1),
          right: BorderSide(color: Colors.black, width: 1),
          bottom: BorderSide(color: Colors.black, width: 1),
        ),
      ),
      child: Text(
        text,
        style: const TextStyle(color: Colors.black, fontSize: 9, fontWeight: FontWeight.bold),
      ),
    );
  }
}
