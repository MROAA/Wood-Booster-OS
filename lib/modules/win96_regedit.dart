import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96RegeditModule extends StatefulWidget {
  const Win96RegeditModule({super.key});

  @override
  State<Win96RegeditModule> createState() => _Win96RegeditModuleState();
}

class _Win96RegeditModuleState extends State<Win96RegeditModule> {
  String _selectedKey = 'HKEY_CLASSES_ROOT';
  String _keyValue = 'Wood-Booster Core Object Handler v4.0';

  final List<Map<String, String>> _keys = [
    {'path': 'HKEY_CLASSES_ROOT', 'val': 'Wood-Booster Core Object Handler v4.0'},
    {'path': 'HKEY_CURRENT_USER\\Control Panel', 'val': 'Theme=Chicago_Classic_96'},
    {'path': 'HKEY_LOCAL_MACHINE\\Software', 'val': 'Win96_Chicago_Build_2296'},
    {'path': 'HKEY_USERS\\.DEFAULT', 'val': 'Active User: wood_booster'},
  ];

  void _selectKey(Map<String, String> keyData) {
    setState(() {
      _selectedKey = keyData['path']!;
      _keyValue = keyData['val']!;
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
              '🛠️ Win96 Registry Editor (regedit.exe)',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _selectedKey,
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Row(
            children: [
              Expanded(
                flex: 1,
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E1E1E),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: Colors.white.withOpacity(0.15)),
                  ),
                  child: ListView.builder(
                    itemCount: _keys.length,
                    itemBuilder: (context, index) {
                      final item = _keys[index];
                      return ListTile(
                        title: Text(item['path']!, style: const TextStyle(color: Colors.white, fontSize: 11)),
                        onPressed: () => _selectKey(item),
                      );
                    },
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 1,
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: Colors.white.withOpacity(0.2)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Avaimen arvo (REG_SZ):', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Text(
                        _keyValue,
                        style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
