# Contributing to Llama Bot Remastered

Thanks for wanting to contribute! This guide will help you get started.

## 🚀 Getting Started

1. **Fork and clone** the repository
2. **Follow the setup** in [README.md](./README.md)
3. **Create a branch** for your changes: `git checkout -b feature/your-feature-name`

## 📝 Development Workflow

### Making Changes

1. **Make your changes** in the codebase
2. **Test locally** with `npm run dev`
3. **Ensure code works** - test your new command/feature
4. **Commit** with clear messages:
   ```bash
   git commit -m "Add: new command to do X"
   ```

### Code Style

- Use **TypeScript** - type your code properly
- Follow existing patterns - look at similar files for examples
- Keep functions small and focused
- Add comments for complex logic

### Adding a New Command

See [README.md](./README.md) for the full example. Quick template:

```typescript
// packages/llama-bot/src/commands/my-command.ts
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("mycommand")
    .setDescription("What it does"),
  async execute(interaction: ChatInputCommandInteraction) {
    // Your code here
    await interaction.reply("Response");
  },
};
```

### Adding an API Endpoint

1. Add route in `packages/llama-api/src/routes/`
2. Use Zod for validation (see `emotes.ts` for example)
3. Register route in `packages/llama-api/src/server.ts`

## 🧪 Testing

- Test your changes locally with `npm run dev`
- Test the bot in a Discord server
- Test API endpoints with curl or Postman
- Check that database migrations work if you changed the schema

## 📤 Submitting Changes

1. **Push your branch**: `git push origin feature/your-feature-name`
2. **Create a Pull Request** on GitHub
3. **Describe your changes** clearly in the PR description
4. **Wait for review** - we'll help you improve if needed!

## ✅ Checklist Before Submitting

- [ ] Code works locally (`npm run dev`)
- [ ] No TypeScript errors
- [ ] Follows existing code style
- [ ] Database migrations work (if schema changed)
- [ ] Commands are registered (if added new command)
- [ ] PR description explains what and why

## 🐛 Reporting Bugs

1. Check if it's already reported
2. Create an issue with:
   - What happened
   - What you expected
   - Steps to reproduce
   - Error messages (if any)

## 💡 Need Help?

- Check the [README.md](./README.md) for common tasks
- Look at existing code for examples
- Ask questions in your PR - we're happy to help!

---

**Remember**: Everyone was a beginner once. Don't hesitate to ask questions! 🎉
