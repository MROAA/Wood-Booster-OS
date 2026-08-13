import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96PrintersModule extends StatefulWidget {
  const Win96PrintersModule({super.key});

  @override
  State<Win96PrintersModule> createState() => _Win96PrintersModuleState();
}

class _Win96PrintersModuleState extends State<Win96PrintersModule> {
  final List<Map<String, String>> _printers = [
    {'name': 'HP LaserJet 4L (PostScript)', 'status': 'Valmis (LPT1)', 'jobs': '0'},
    {'name': 'Epson Stylus Color (InkJet)', 'status': 'Virhetila / Paper out', 'jobs': '2'},
    {'name': 'Win96 Fax Service v4.0', 'status': 'Valmiustilassa', 'jobs': '0'},
  ];

  String _selectedPrinterStatus = 'Valitse tulostin tarkastellaksesi jonoa.';

  void _inspectPrinter(Map<String, String> printer) {
    setState(() {
      _selectedPrinterStatus = 'Tulostin: ${printer['name']}\nTila: ${printer['status']}\nAktiiviset työt: ${printer['jobs']} kpl odottaa portissa.';
    });
  }

  void _clearQueue() {
    setState(() {
      _selectedPrinterStatus = 'Tulostusjono tyhjennetty onnistuneesti.';
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
              '🖨️ Win96 Printers & Faxes (printers.folder)',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Laitteita: ${_printers.length}',
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
              itemCount: _printers.length,
              itemBuilder: (context, index) {
                final printer = _printers[index];
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
                          Text(printer['name']!, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                          Text('Tila: ${printer['status']} • Jonossa: ${printer['jobs']} työtä', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Button(
                        onPressed: () => _inspectPrinter(printer),
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
                  _selectedPrinterStatus,
                  style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Button(
              onPressed: _clearQueue,
              child: const Text('Tyhjennä jono'),
            ),
          ],
        ),
      ],
    );
  }
}
