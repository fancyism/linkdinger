"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Home, FileText, Sparkles } from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  posts?: any[];
}

export function CommandPalette({
  open,
  setOpen,
  posts = [],
}: CommandPaletteProps) {
  const t = useTranslations("CommandPalette");
  const router = useRouter();

  const runCommand = React.useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    [setOpen],
  );

  return (
    <AnimatePresence>
      {open && (
        <Command.Dialog
          open={open}
          onOpenChange={setOpen}
          label={t("label")}
          className="w-full"
          overlayClassName="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md"
          contentClassName="fixed inset-0 z-[101] flex w-full items-center justify-center px-4 py-6 sm:px-6 sm:py-10"
        >
          <Dialog.Title className="sr-only">{t("label")}</Dialog.Title>

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative z-10 mx-auto w-full max-w-[600px]"
          >
            {/* The Actual Command Palette using Liquid Glass Aesthetic */}
            <div className="overflow-hidden rounded-2xl glass-modal ring-1 ring-white/10 dark:ring-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] dark:bg-slate-900/40 bg-white/40 backdrop-blur-2xl">
              <div className="flex items-center px-4 border-b border-black/10 dark:border-white/10">
                <Search className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3 shrink-0" />
                <Command.Input
                  autoFocus
                  placeholder={t("placeholder")}
                  className="w-full h-14 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500 font-sans text-lg"
                />
              </div>

              <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
                <Command.Empty className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  {t("empty")}
                </Command.Empty>

                <Command.Group
                  heading={t("navigation")}
                  className="px-2 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  <Command.Item
                    onSelect={() => runCommand(() => router.push("/"))}
                    className="flex items-center px-3 py-3 mt-1 text-sm text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer transition-colors aria-selected:bg-black/5 dark:aria-selected:bg-white/10 aria-selected:text-gray-900 dark:aria-selected:text-white group"
                  >
                    <Home className="w-4 h-4 mr-3 text-gray-400 group-aria-selected:text-peach" />
                    {t("goHome")}
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push("/blog"))}
                    className="flex items-center px-3 py-3 mt-1 text-sm text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer transition-colors aria-selected:bg-black/5 dark:aria-selected:bg-white/10 aria-selected:text-gray-900 dark:aria-selected:text-white group"
                  >
                    <FileText className="w-4 h-4 mr-3 text-gray-400 group-aria-selected:text-peach" />
                    {t("goBlog")}
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push("/prompts"))}
                    className="flex items-center px-3 py-3 mt-1 text-sm text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer transition-colors aria-selected:bg-black/5 dark:aria-selected:bg-white/10 aria-selected:text-gray-900 dark:aria-selected:text-white group"
                  >
                    <Sparkles className="w-4 h-4 mr-3 text-gray-400 group-aria-selected:text-peach" />
                    {t("goPrompts")}
                  </Command.Item>
                </Command.Group>

                {posts.length > 0 && (
                  <Command.Group
                    heading={t("posts")}
                    className="px-2 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {posts.map((post) => (
                      <Command.Item
                        key={post.slug}
                        onSelect={() =>
                          runCommand(() => router.push(`/blog/${post.slug}`))
                        }
                        className="flex items-center px-3 py-3 mt-1 text-sm text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer transition-colors aria-selected:bg-black/5 dark:aria-selected:bg-white/10 aria-selected:text-gray-900 dark:aria-selected:text-white group"
                      >
                        <FileText className="w-4 h-4 mr-3 text-gray-400 group-aria-selected:text-peach" />
                        <span className="truncate">{post.title}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </Command.List>
            </div>
          </motion.div>
        </Command.Dialog>
      )}
    </AnimatePresence>
  );
}
