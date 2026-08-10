import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96DevicesModule extends StatefulWidget {
  const Win96DevicesModule({super.key});

  @override
  State<Win96DevicesModule> createState() => _Win96DevicesModuleState();
}

class _Win96DevicesModuleState extends State<Win96DevicesModule> {
  final List<Map<String, String>> _devices = [
    {'name': 'Wood-Booster 3D Graphics Accelerator', 'status': 'OK (Driver v4.1)', 'type': 'Display Adapter'},
    {'name': 'SoundBlaster 16 Compatible Audio', 'status': 'OK (IRQ 5, DMA 1)', 'type': 'Sound Controller'},
    {'name': 'NE2000 Compatible PCI Ethernet Adapter', 'status': 'OK (Connected)', 'type': 'Network Adapter'},
    {'name': 'Standard 101/102-Key Keyboard', 'status': 'OK', 'type': 'Input Device'},
  ];

  String _selectedStatus = 'Valitse laite tarkastellaksesi ajuria.';

  void _inspectDevice(String name) {
    setState(() {
      _selectedStatus = 'Ajuri tarkistettu: $name toimii normaalisti ilman ristiriitoja.';
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
              '🔌 Win96 Device Manager (devmgmt.msc)',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Laitteita: ${_devices.length}',
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
              itemCount: _devices.length,
              itemBuilder: (context, index) {
                final dev = _devices[index];
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.05))),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(dev['name']!, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                          Text('${dev['type']} • Tila: ${dev['status']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Button(
                        onPressed: () => _inspectDevice(dev['name']!),
                        child: const Text('Ominaisuudet'),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 10),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: Colors.white.withOpacity(0.2)),
          ),
          child: Text(
            _selectedStatus,
            style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
          ),
        ),
      ],
    );
  }
}
