<h1 align="center">
  <br>
  <a href="https://overleaf-pro.ayaka.space"><img src="doc/logo.png" alt="Ayakaleaf Pro" width="300"></a>
</h1>

<h4 align="center">Overleaf Community Edition enhanced with all Pro features <br/>(open source, free to use, self-hostable).</h4>

<p align="center">
  <a href="https://overleaf-pro.ayaka.space">Documents</a> •
  <a href="https://github.com/orgs/ayaka-notes/packages/container/package/overleaf-pro">Docker Image</a> •
  <a href="https://github.com/ayaka-notes/texlive-full">TeXLive</a> •
  <a href="https://overleaf-pro.ayaka.space/dev">Developer</a> •
  <a href="#authors">Authors</a> •
  <a href="#license">License</a>
</p>

<img src="doc/screenshot-pro.png" alt="A screenshot of a project being edited in Overleaf Community Edition">
<p align="center">
  Figure 1: A screenshot of a project being edited in Ayakaleaf Pro Edition.
</p>

## Ayakaleaf Pro Edition
Ayakaleaf Pro is an enhanced version of Overleaf with almost all features and capabilities. For details, please check [Ayakaleaf Pro](https://overleaf-pro.ayaka.space) page. Features in Ayakaleaf Pro include: 

- Pandoc Import/Export (Features in SaaS Platform)
- Python Script Runner (Features in SaaS Platform)
- 2-way GitHub Sync (Features in SaaS Platform)
- Zotero Integration(With Zotero OAuth Support)
- Advanced Reference Search (Features in SaaS Platform)
- Git-Bridge Support (Features in Server Pro)
- Admin Panel (Global Users/Projects management)
- SSO with LDAP and SAML or OAuth 2.0
- Unlimited Compile Times (Adjustable in admin panel)
- Self Register (Optional, can be limited by mail domain)
- Sandbox Compile (With [texlive-full](https://github.com/ayaka-notes/texlive-full) image support)
- Template System (With Template Gallery)
- Track Changes (With Review and Comment Panel)
- Full Project History(With Restore and Download)
- Symbol Palette (Features in Server Pro/SaaS Platform)
- ARM Support(x86_64/arm64 on Docker)

Last but not least, Ayakaleaf Pro is open-source, free to use and modify. You can self-host it and contribute to the development of Ayakaleaf Pro. For more details, please check [Developer Documentation](https://overleaf-pro.ayaka.space/dev) page.

> [!NOTE]
> Note: Ayakaleaf Pro is not affiliated with Overleaf, Inc. or its parent company, Digital Science. It is also *not Server Pro* Edition, which is a commercial product offered by Overleaf, Inc.
> 
> Ayakaleaf Pro is an independent project developed and maintained by the [ayaka-notes](https://github.com/ayaka-notes).

## Installation

We have detailed installation instructions on the [Documents](https://overleaf-pro.ayaka.space/) page. We highly recommend installing Ayakaleaf Pro using the [ayaka-notes/Toolkit](https://github.com/ayaka-notes/toolkit/).

## Upgrading

If you are upgrading from a previous version of Ayakaleaf Pro, please see the [Releases page](https://github.com/ayaka-notes/overleaf-pro/releases) for the changes in each version between your current version and the one you are upgrading to.

## Translations

We welcome contributions to translations of Ayakaleaf Pro. Generally, we use claude.ai to translate the English text into other languages. If you find any errors in the translations, please submit a pull request to fix them. Please only modify relevant files in the `services/web/locales/locales_patches` folder.

Files under `services/web/locales/` are overleaf official translation files. Please do not modify them directly.

## Contributing

Please see the [CONTRIBUTING](CONTRIBUTING.md) file for information on contributing to the development of Overleaf.

## Authors

- [The Overleaf Team](https://www.overleaf.com/about)
- [Features and Copyright](https://overleaf-pro.ayaka.space/on-premises/readme/features-and-copyright)

## License

The code in this repository is released under the GNU AFFERO GENERAL PUBLIC LICENSE, version 3. A copy can be found in the [`LICENSE`](LICENSE) file.

- Copyright (c) Overleaf, 2014-2025.
- Copyright (c) [Pro Authors](https://overleaf-pro.ayaka.space/on-premises/readme/features-and-copyright), 2026-now.

## Sponsor
- [OpenAI Codex OSS](https://openai.com/en/form/codex-for-oss/)
- [GitBook](https://www.gitbook.com/)

## Star History

<a href="https://www.star-history.com/?repos=ayaka-notes%2Fayakaleaf-pro&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=ayaka-notes/ayakaleaf-pro&type=date&theme=dark&legend=top-left&sealed_token=u3l5zBKFPuzl3y_xdCmqTPT_5iaimMLJchJaALvNsAR3LtSu2NrnvjlmbfGW1NdyDch3XLj-o6rfTpyk2K7s6gtgdzDvrDAsTkBnGz_m2CAkbq0IvxsFXPzEkypDT3vhHvYsvDu3qd7Dx6LcPFy_330a0kqmByAl6FKN-13QCGuo1LTv0iEUihWDTUlz" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=ayaka-notes/ayakaleaf-pro&type=date&legend=top-left&sealed_token=u3l5zBKFPuzl3y_xdCmqTPT_5iaimMLJchJaALvNsAR3LtSu2NrnvjlmbfGW1NdyDch3XLj-o6rfTpyk2K7s6gtgdzDvrDAsTkBnGz_m2CAkbq0IvxsFXPzEkypDT3vhHvYsvDu3qd7Dx6LcPFy_330a0kqmByAl6FKN-13QCGuo1LTv0iEUihWDTUlz" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=ayaka-notes/ayakaleaf-pro&type=date&legend=top-left&sealed_token=u3l5zBKFPuzl3y_xdCmqTPT_5iaimMLJchJaALvNsAR3LtSu2NrnvjlmbfGW1NdyDch3XLj-o6rfTpyk2K7s6gtgdzDvrDAsTkBnGz_m2CAkbq0IvxsFXPzEkypDT3vhHvYsvDu3qd7Dx6LcPFy_330a0kqmByAl6FKN-13QCGuo1LTv0iEUihWDTUlz" />
 </picture>
</a>
