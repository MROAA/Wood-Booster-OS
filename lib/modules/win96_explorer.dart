import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96ExplorerModule extends StatefulWidget {
  const Win96ExplorerModule({super.key});

  @override
  State<Win96ExplorerModule> createState() => _Win96ExplorerModuleState();
}

class _Win96ExplorerModuleState extends State<Win96ExplorerModule> {
  String _currentPath = 'C:\\WOOD_OS\\SYSTEM';
  final List<Map<String, String>> _files = [
    {'name': 'KERNEL32.DLL', 'size': '42 KB', 'type': 'System File'},
    {'name': 'SPACEMONKEY.EXE', 'size': '1.2 MB', 'type': 'Application'},
    {'name': 'BACKIRAUH.JPG', 'size': '850 KB', 'type': 'Bitmap Image'},
    {'name': 'MOLTBOOK_BRIDGE.CFG', 'size': '4 KB', 'type': 'Configuration'},
    {'name': 'WIN96_CHIMES.WAV', 'size': '240 KB', 'type': 'Sound Clip'},
  ];

  void _openFile(String fileName) {
    setState(() {
      _currentPath = 'C:\\WOOD_OS\\SYSTEM\\$fileName (Avattu)';
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
              '📁 Win96 File Explorer / Control Panel',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _currentPath,
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.white.withOpacity(0.15)),
            ),
            child: ListView.builder(
              itemCount: _files.length,
              itemBuilder: (context, index) {
                final file = _files[index];
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.05))),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(FluentIcons.file_code, size: 16, color: Colors.blue),
                          const SizedBox(width: 10),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(file['name']!, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                              Text('${file['type']} • ${file['size']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                            ],
                          ),
                        ],
                      ),
                      Button(
                        onPressed: () => _openFile(file['name']!),
                        child: const Text('Avaa'),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}
