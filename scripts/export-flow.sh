#!/usr/bin/env bash

# ==============================================================================
# 5-Node Lifecycle & Engineering Hub Flow Exporter
# ==============================================================================
# Usage: ./scripts/export-flow.sh <target-directory> [options]
# Options:
#   --name <project-name>       Name of the target project
#   --framework <framework>     Framework (e.g. "TanStack Start", "Next.js", "Vite React")
#   --db <db-engine>            Database (e.g. "Supabase PostgreSQL", "Prisma", "Drizzle")
#   --build <build-command>     Build command (default: "pnpm run build")
# ==============================================================================

set -e

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../templates/5-node-lifecycle" && pwd)"

if [ -z "$1" ]; then
  echo "❌ Error: Target directory is required."
  echo "Usage: $0 <target-project-directory> [--name \"My App\"] [--framework \"Next.js\"]"
  exit 1
fi

TARGET_DIR="$1"
shift

PROJECT_NAME=""
FRAMEWORK_NAME="TanStack Start (Vite + SSR)"
STYLING_ENGINE="Tailwind CSS v4 & Radix UI primitives"
DATABASE_ENGINE="Supabase PostgreSQL & Row-Level Security"
DATA_FETCHING_ENGINE="TanStack Query & Server Functions"
BUILD_COMMAND="pnpm run build"

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --name) PROJECT_NAME="$2"; shift ;;
    --framework) FRAMEWORK_NAME="$2"; shift ;;
    --db) DATABASE_ENGINE="$2"; shift ;;
    --build) BUILD_COMMAND="$2"; shift ;;
    *) echo "Unknown parameter passed: $1"; exit 1 ;;
  esac
  shift
done

if [ -z "$PROJECT_NAME" ]; then
  PROJECT_NAME="$(basename "$TARGET_DIR")"
fi

echo "🚀 Exporting 5-Node Lifecycle Flow to: $TARGET_DIR"
echo "   Project Name:  $PROJECT_NAME"
echo "   Framework:     $FRAMEWORK_NAME"
echo "   Database:      $DATABASE_ENGINE"
echo "   Build Command: $BUILD_COMMAND"
echo ""

mkdir -p "$TARGET_DIR/.agents/rules"
mkdir -p "$TARGET_DIR/.agents/templates/subagents"
mkdir -p "$TARGET_DIR/.agents/agents"
mkdir -p "$TARGET_DIR/handoffs/template"
mkdir -p "$TARGET_DIR/scripts"

# Copy rules, templates, and agents
cp -r "$SOURCE_DIR/.agents/rules/"* "$TARGET_DIR/.agents/rules/"
cp -r "$SOURCE_DIR/.agents/templates/subagents/"* "$TARGET_DIR/.agents/templates/subagents/"
cp -r "$SOURCE_DIR/.agents/agents/"* "$TARGET_DIR/.agents/agents/"
cp -r "$SOURCE_DIR/handoffs/template/"* "$TARGET_DIR/handoffs/template/"
cp "$SOURCE_DIR/../../scripts/run_5node_flow.py" "$TARGET_DIR/scripts/run_5node_flow.py" 2>/dev/null || true

# Process AGENTS.md with variable substitution
sed -e "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" \
    -e "s|{{FRAMEWORK_NAME}}|$FRAMEWORK_NAME|g" \
    -e "s|{{STYLING_ENGINE}}|$STYLING_ENGINE|g" \
    -e "s|{{DATABASE_ENGINE}}|$DATABASE_ENGINE|g" \
    -e "s|{{DATA_FETCHING_ENGINE}}|$DATA_FETCHING_ENGINE|g" \
    -e "s|{{BUILD_COMMAND}}|$BUILD_COMMAND|g" \
    "$SOURCE_DIR/AGENTS.md" > "$TARGET_DIR/AGENTS.md"

# Process subagent templates
for file in "$TARGET_DIR/.agents/templates/subagents/"*.md; do
  [ -f "$file" ] || continue
  sed -i '' -e "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" \
            -e "s|{{BUILD_COMMAND}}|$BUILD_COMMAND|g" \
            -e "s|{{LOCAL_BUILD_COMMAND}}|$BUILD_COMMAND|g" \
            "$file" 2>/dev/null || sed -i -e "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" \
                                          -e "s|{{BUILD_COMMAND}}|$BUILD_COMMAND|g" \
                                          -e "s|{{LOCAL_BUILD_COMMAND}}|$BUILD_COMMAND|g" \
                                          "$file"
done

# Process agent profiles
find "$TARGET_DIR/.agents/agents" -name "*.md" -type f | while read -r file; do
  sed -i '' -e "s|BrgyConnect|$PROJECT_NAME|g" "$file" 2>/dev/null || sed -i -e "s|BrgyConnect|$PROJECT_NAME|g" "$file"
done

echo "✅ Successfully exported 5-Node Lifecycle Flow to $TARGET_DIR!"
echo ""
echo "Files installed in target project:"
echo "  ├── AGENTS.md"
echo "  ├── .agents/"
echo "  │   ├── agents/"
echo "  │   │   ├── 01-product-strategist/"
echo "  │   │   ├── 02-ui-ux-designer/"
echo "  │   │   ├── 03-engineering-hub/ (subroles & rework rules)"
echo "  │   │   ├── 04-dba-architect/"
echo "  │   │   └── 05-community-poster/"
echo "  │   ├── rules/"
echo "  │   │   ├── tdd-workflow.md"
echo "  │   │   ├── git-approval-gate.md"
echo "  │   │   └── db-migration-gate.md"
echo "  │   └── templates/subagents/"
echo "  │       ├── builder_template.md"
echo "  │       ├── critic_qa_template.md"
echo "  │       └── ui_ux_designer_template.md"
echo "  ├── scripts/"
echo "  │   └── run_5node_flow.py"
echo "  └── handoffs/"
echo "      └── template/"
echo "          ├── 01_product_brief.md"
echo "          ├── 02_design_spec.md"
echo "          ├── 03_implementation_plan.md"
echo "          ├── 04_dba_audit_report.md"
echo "          ├── 05_qa_verification_report.md"
echo "          └── 06_release_post.md"
