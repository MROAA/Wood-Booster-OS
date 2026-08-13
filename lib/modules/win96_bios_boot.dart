import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96BiosBootModule extends StatefulWidget {
  const Win96BiosBootModule({super.key});

  @override
  State<Win96BiosBootModule> createState() => _Win96BiosBootModuleState();
}

class _Win96BiosBootModuleState extends State<Win96BiosBootModule> {
  String _biosLog = 'AWARD BIOS v4.51PG, An Energy Star Ally\nCopyright (C) 1996, Award Software, Inc.\n\nPENTIUM PRO-200 CPU Check... OK\nMemory Test: 65536K OK\n\nPrimary Master: WOOD_OS VIRTUAL DISK C:\nSecondary Slave: CD-ROM 32X\n\nPress F2 to enter SETUP\nPress DEL to enter BIOS';
  bool _setupEntered = false;

  void _enterBiosSetup() {
    setState(() {
      _setupEntered = true;
      _biosLog = '--- AWARD BIOS CMOS SETUP UTILITY ---\n\n> Standard CMOS Setup\n> Advanced Chipset Features\n> Power Management Setup\n> PnP/PCI Configuration\n\n[ESC] Exit  [Arrows] Select Item';
    });
  }

  void _exitBiosSetup() {
    setState(() {
      _setupEntered = false;
      _biosLog = 'AWARD BIOS v4.51PG, An Energy Star Ally\nCopyright (C) 1996, Award Software, Inc.\n\nPENTIUM PRO-200 CPU Check... OK\nMemory Test: 65536K OK\n\nPrimary Master: WOOD_OS VIRTUAL DISK C:\nSecondary Slave: CD-ROM 32X\n\nPress F2 to enter SETUP\nPress DEL to enter BIOS';
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
              '💻 Win96 BIOS POST & Hardware Check',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _setupEntered ? 'CMOS SETUP' : 'POST MODE',
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.white.withOpacity(0.2)),
            ),
            child: SingleChildScrollView(
              child: Text(
                _biosLog,
                style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12, fontFamily: 'monospace'),
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Button(
              onPressed: _enterBiosSetup,
              child: const Text('Paina F2 (Setup)'),
            ),
            Button(
              onPressed: _exitBiosSetup,
              child: const Text('Paina ESC (Jatka käynnistystä)'),
            ),
          ],
        ),
      ],
    );
  }
}
