import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96EventsModule extends StatefulWidget {
  const Win96EventsModule({super.key});

  @override
  State<Win96EventsModule> createState() => _Win96EventsModuleState();
}

class _Win96EventsModuleState extends State<Win96EventsModule> {
  final List<Map<String, String>> _events = [
    {'type': 'INFO', 'source': 'WoodBoot', 'time': '12:00:01', 'desc': 'Kernel käynnistetty onnistuneesti (Build 2296).'},
    {'type': 'WARNING', 'source': 'SoundBlaster', 'time': '12:00:05', 'desc': 'MIDI portti 330h varattu toiselle laitteelle.'},
    {'type': 'ERROR', 'source': 'DiskEngine', 'time': '12:00:12', 'desc': 'C:\\ -aseman klusterin tarkistuksessa lievä viive.'},
    {'type': 'INFO', 'source': 'Network', 'time': '12:00:20', 'desc': 'Dial-up yhteys muodostettu (56,000 bps).'},
  ];

  String _selectedLogDetail = 'Valitse lokitieto nähdäksesi tarkemmat tiedot.';

  void _inspectEvent(Map<String, String> event) {
    setState(() {
      _selectedLogDetail = 'Tyyppi: ${event['type']}\nLähde: ${event['source']}\nAika: ${event['time']}\nKuvaus: ${event['desc']}';
    });
  }

  void _clearLogs() {
    setState(() {
      _events.clear();
      _selectedLogDetail = 'Lokit tyhjennetty muistista.';
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
              '📋 Win96 Event Viewer (eventvwr.exe)',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Lokit: ${_events.length}',
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
              itemCount: _events.length,
              itemBuilder: (context, index) {
                final event = _events[index];
                return ListTile(
                  title: Text('[${event['type']}] ${event['source']} (${event['time']})', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                  subtitle: Text(event['desc']!, style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                  onPressed: () => _inspectEvent(event),
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: Colors.white.withOpacity(0.2)),
                ),
                child: Text(
                  _selectedLogDetail,
                  style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Button(
              onPressed: _clearLogs,
              child: const Text('Tyhjennä lokit'),
            ),
          ],
        ),
      ],
    );
  }
}
