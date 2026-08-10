import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentMemoryModule extends StatefulWidget {
  const DigitalEnvironmentMemoryModule({super.key});

  @override
  State<DigitalEnvironmentMemoryModule> createState() => _DigitalEnvironmentMemoryModuleState();
}

class _DigitalEnvironmentMemoryModuleState extends State<DigitalEnvironmentMemoryModule> {
  final List<Map<String, String>> _vectorMemory = [
    {'id': 'MEM-001', 'topic': 'Win96 Kernel Architecture', 'tokens': '1,024', 'status': 'Vakioitu'},
    {'id': 'MEM-002', 'topic': 'Digital Space Telemetry Logs', 'tokens': '512', 'status': 'Indeksoitu'},
    {'id': 'MEM-003', 'topic': 'User Prompt Patterns & Habits', 'tokens': '2,048', 'status': 'Aktiivinen'},
  ];

  String _selectedMemoryDetail = 'Valitse muistilohko tarkastellaksesi vektoriupotuksia.';

  void _inspectMemory(Map<String, String> memory) {
    setState(() {
      _selectedMemoryDetail = 'Muistilohko: ${memory['id']}\nAihe: ${memory['topic']}\nToken-määrä: ${memory['tokens']}\nTila: ${memory['status']}\nVektoriupotus: [Optimized & Ready]';
    });
  }

  void _compactMemory() {
    setState(() {
      _selectedMemoryDetail = 'Muistinhallinta suoritettu: Vektorivarasto tiivistetty ja konteksti optimoitu.';
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
              '🧠 AI Neural Memory & Context Retention Engine',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Vektorit: ${_vectorMemory.length}',
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
              itemCount: _vectorMemory.length,
              itemBuilder: (context, index) {
                final mem = _vectorMemory[index];
                return ListTile(
                  title: Text('[${mem['id']}] ${mem['topic']}', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                  subtitle: Text('Tokenit: ${mem['tokens']} • Tila: ${mem['status']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                  onPressed: () => _inspectMemory(mem),
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
                  _selectedMemoryDetail,
                  style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Button(
              onPressed: _compactMemory,
              child: const Text('Tiivistä muisti'),
            ),
          ],
        ),
      ],
    );
  }
}
