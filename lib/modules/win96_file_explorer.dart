import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96FileExplorerModule extends StatefulWidget {
  const Win96FileExplorerModule({super.key});

  @override
  State<Win96FileExplorerModule> createState() => _Win96FileExplorerModuleState();
}

class _Win96FileExplorerModuleState extends State<Win96FileExplorerModule> {
  String _currentPath = 'C:\\Win96\\Modules';
  String _explorerStatus = 'File Explorer aktiivinen: Valmiina selaamaan järjestelmän tiedostoja.';

  final List<Map<String, String>> _directoryFiles = [
    {'name': 'spacemonkey_core.dart', 'size': '64 KB', 'type': 'Dart Source'},
    {'name': 'win96_desktop_shell.dart', 'size': '48 KB', 'type': 'Dart Source'},
    {'name': 'omniversal_matrix.dll', 'size': '512 KB', 'type': 'System Library'},
    {'name': 'config_quantum.ini', 'size': '4 KB', 'type': 'Configuration'},
  ];

  void _navigatePath(String path) {
    setState(() {
      _currentPath = path;
      _explorerStatus = 'Siirrytty kansioon: $path';
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
              '📂 Win96 File Explorer & Directory Shell',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _currentPath,
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
            _explorerStatus,
            style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
          ),
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFFC0C0C0),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: Colors.white.withOpacity(0.3), width: 2),
            ),
            child: Column(
              children: [
                // Simuloitu työkalurivi
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFD4D0C8),
                    border: Border(bottom: BorderSide(color: Colors.black, width: 1)),
                  ),
                  child: Row(
                    children: [
                      _buildToolbarButton('← Takaisin'),
                      const SizedBox(width: 4),
                      _buildToolbarButton('→ Eteenpäin'),
                      const SizedBox(width: 4),
                      _buildToolbarButton('⬆ Ylös'),
                    ],
                  ),
                ),
                // Tiedostolista
                Expanded(
                  child: Container(
                    color: Colors.white,
                    margin: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      border: Border(
                        top: BorderSide(color: Colors.black, width: 1),
                        left: BorderSide(color: Colors.black, width: 1),
                        right: BorderSide(color: Colors.white, width: 1),
                        bottom: BorderSide(color: Colors.white, width: 1),
                      ),
                    ),
                    child: ListView.builder(
                      itemCount: _directoryFiles.length,
                      itemBuilder: (context, index) {
                        final file = _directoryFiles[index];
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                          decoration: BoxDecoration(
                            border: Border(bottom: BorderSide(color: Colors.grey.withOpacity(0.2))),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Text('📄 ', style: TextStyle(fontSize: 12)),
                                  Text(
                                    file['name']!,
                                    style: const TextStyle(color: Colors.black, fontSize: 11, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                              Row(
                                children: [
                                  Text(
                                    file['type']!,
                                    style: TextStyle(color: Colors.grey[700], fontSize: 10),
                                  ),
                                  const SizedBox(width: 16),
                                  Text(
                                    file['size']!,
                                    style: const TextStyle(color: Color(0xFF000080), fontSize: 10, fontFamily: 'monospace'),
                                  ),
                                ],
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
              onPressed: () => _navigatePath('C:\\Win96\\System'),
              child: const Text('Vaihda System-kansioon'),
            ),
            Button(
              onPressed: () => _navigatePath('C:\\Win96\\Modules'),
              child: const Text('Vaihda Modules-kansioon'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildToolbarButton(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
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
        style: const TextStyle(color: Colors.black, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }
}
