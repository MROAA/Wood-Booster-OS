import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentPrismMatrixModule extends StatefulWidget {
  const DigitalEnvironmentPrismMatrixModule({super.key});

  @override
  State<DigitalEnvironmentPrismMatrixModule> createState() => _DigitalEnvironmentPrismMatrixModuleState();
}

class _DigitalEnvironmentPrismMatrixModuleState extends State<DigitalEnvironmentPrismMatrixModule> {
  bool _prismMatrixActive = true;
  double _prismSpectrum = 100.0;
  String _prismStatus = 'Prism-Matrix aktiivinen: Valospektri ja energiataajuuksien taittaja valmiina.';
  
  final List<Map<String, String>> _prismNodes = [
    {'node': 'Omniversal Prism Core', 'tier': 'Absolute Spectrum', 'status': 'Taittaa (100%)'},
    {'node': 'Win96 Photon Grid', 'tier': 'Zero-Latency', 'status': 'Aktivoitu'},
    {'node': 'Spacemonkey Eternal Rainbow', 'tier': 'Transcendent', 'status': 'Valmiina'},
  ];

  void _pulsePrismMatrix() {
    setState(() {
      _prismSpectrum = 100.0;
      _prismStatus = 'Prism-Matrix pulssi laukaistu: Valovirrat ja taajuudet tulvivat läpi järjestelmän.';
      _prismNodes.insert(0, {
        'node': 'Horizon-Omega Prism Matrix',
        'tier': 'Beyond Absolute',
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
              '💎 Spacemonkey Prism-Matrix & Light Spectrum',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Spektri: ${_prismSpectrum.toStringAsFixed(0)}%',
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
            _prismStatus,
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
              itemCount: _prismNodes.length,
              itemBuilder: (context, index) {
                final node = _prismNodes[index];
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
              onPressed: _pulsePrismMatrix,
              child: const Text('Aktivoi Prism-Matrix Pulssi'),
            ),
            ToggleSwitch(
              checked: _prismMatrixActive,
              content: const Text('Prism-Matrix -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _prismMatrixActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
