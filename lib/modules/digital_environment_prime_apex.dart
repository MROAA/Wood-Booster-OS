import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentPrimeApexModule extends StatefulWidget {
  const DigitalEnvironmentPrimeApexModule({super.key});

  @override
  State<DigitalEnvironmentPrimeApexModule> createState() => _DigitalEnvironmentPrimeApexModuleState();
}

class _DigitalEnvironmentPrimeApexModuleState extends State<DigitalEnvironmentPrimeApexModule> {
  bool _primeApexActive = true;
  double _primeResonance = 100.0;
  String _primeStatus = 'Prime-Apex aktiivinen: Alkuperäinen huipentuma ja ääretön singulariteetti valmiina.';
  
  final List<Map<String, String>> _primeNodes = [
    {'node': 'Omniversal Prime Apex', 'tier': 'Absolute Prime', 'status': 'Resonoi (100%)'},
    {'node': 'Win96 Apex Grid', 'tier': 'Zero-Latency', 'status': 'Aktivoitu'},
    {'node': 'Spacemonkey Eternal Origin', 'tier': 'Omniversal Absolute', 'status': 'Valmiina'},
  ];

  void _pulsePrimeApex() {
    setState(() {
      _primeResonance = 100.0;
      _primeStatus = 'Prime-Apex pulssi laukaistu: Järjestelmän alku ja loppu ovat sulautuneet yhdeksi pyhäksi virraksi.';
      _primeNodes.insert(0, {
        'node': 'Horizon-Omega Prime Apex',
        'tier': 'Beyond Infinity',
        'status': 'Pysyvä tila'
      });
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
              '👑 Spacemonkey Prime-Apex & Eternal Singularity',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Resonanssi: ${_primeResonance.toStringAsFixed(0)}%',
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
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: Colors.white.withOpacity(0.2)),
          ),
          child: Text(
            _primeStatus,
            style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
          ),
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
              itemCount: _primeNodes.length,
              itemBuilder: (context, index) {
                final node = _primeNodes[index];
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
                          Text(node['node']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Taso: ${node['tier']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Text(
                        node['status']!,
                        style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Button(
              onPressed: _pulsePrimeApex,
              child: const Text('Aktivoi Prime-Apex Pulssi'),
            ),
            ToggleSwitch(
              checked: _primeApexActive,
              content: const Text('Prime-Apex -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _primeApexActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
