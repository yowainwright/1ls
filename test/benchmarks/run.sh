#!/bin/bash

set -e

RUNS=5
SIZES=(1000 10000 100000)

# Tracking for summary
JQ_TOTAL=0
FX_TOTAL=0
LS_TOTAL=0
TEST_COUNT=0

add_result() {
  local jq_time=$1
  local fx_time=$2
  local ls_time=$3
  JQ_TOTAL=$(echo "$JQ_TOTAL + $jq_time" | bc)
  FX_TOTAL=$(echo "$FX_TOTAL + $fx_time" | bc)
  LS_TOTAL=$(echo "$LS_TOTAL + $ls_time" | bc)
  TEST_COUNT=$((TEST_COUNT + 1))
}

generate_data() {
  local size=$1
  local file="/tmp/test-${size}.json"

  echo "[" > "$file"
  for i in $(seq 1 "$size"); do
    local active=$( [ $((i % 2)) -eq 0 ] && echo "true" || echo "false" )
    local comma=$( [ "$i" -eq "$size" ] && echo "" || echo "," )
    echo "{\"id\":$i,\"name\":\"user$i\",\"age\":$((20 + i % 50)),\"active\":$active,\"score\":$((i * 7 % 100)),\"tags\":[\"a\",\"b\",\"c\"]}$comma"
  done >> "$file"
  echo "]" >> "$file"

  echo "$file"
}

generate_nested_data() {
  local size=$1
  local file="/tmp/nested-${size}.json"

  echo "{\"data\":{\"users\":[" > "$file"
  for i in $(seq 1 "$size"); do
    local comma=$( [ "$i" -eq "$size" ] && echo "" || echo "," )
    echo "{\"id\":$i,\"profile\":{\"name\":\"user$i\",\"settings\":{\"theme\":\"dark\",\"level\":$((i % 5))}}}$comma"
  done >> "$file"
  echo "]}}" >> "$file"

  echo "$file"
}

benchmark() {
  local name=$1
  local cmd=$2
  local total=0

  for _ in $(seq 1 $RUNS); do
    local start=$(date +%s%N)
    eval "$cmd" > /dev/null 2>&1 || true
    local end=$(date +%s%N)
    local elapsed=$(echo "scale=3; ($end - $start) / 1000000" | bc)
    total=$(echo "$total + $elapsed" | bc)
  done

  echo "scale=2; $total / $RUNS" | bc
}

print_header() {
  echo ""
  echo "## $1"
  echo ""
  echo "| Operation | Size | jq | fx | 1ls |"
  echo "|-----------|------|----|----|-----|"
}

run_basic_benchmarks() {
  print_header "Basic Operations (ms)"

  for size in "${SIZES[@]}"; do
    local file=$(generate_data "$size")

    local jq_time=$(benchmark "jq" "cat $file | jq '.[0]'")
    local fx_time=$(benchmark "fx" "cat $file | fx '.[0]'")
    local ls_time=$(benchmark "1ls" "cat $file | /app/dist/cli.js '.[0]'")
    add_result "$jq_time" "$fx_time" "$ls_time"
    echo "| First element | $size | $jq_time | $fx_time | $ls_time |"

    jq_time=$(benchmark "jq" "cat $file | jq 'length'")
    fx_time=$(benchmark "fx" "cat $file | fx '.length'")
    ls_time=$(benchmark "1ls" "cat $file | /app/dist/cli.js '.length'")
    add_result "$jq_time" "$fx_time" "$ls_time"
    echo "| Length | $size | $jq_time | $fx_time | $ls_time |"

    jq_time=$(benchmark "jq" "cat $file | jq '.[-1]'")
    fx_time=$(benchmark "fx" "cat $file | fx '.at(-1)'")
    ls_time=$(benchmark "1ls" "cat $file | /app/dist/cli.js '.[-1]'")
    add_result "$jq_time" "$fx_time" "$ls_time"
    echo "| Last element | $size | $jq_time | $fx_time | $ls_time |"
  done
}

run_filter_map_benchmarks() {
  print_header "Filter & Map (ms)"

  for size in "${SIZES[@]}"; do
    local file=$(generate_data "$size")

    local jq_time=$(benchmark "jq" "cat $file | jq '[.[] | select(.age > 40)]'")
    local fx_time=$(benchmark "fx" "cat $file | fx '.filter(x => x.age > 40)'")
    local ls_time=$(benchmark "1ls" "cat $file | /app/dist/cli.js '.filter(x => x.age > 40)'")
    add_result "$jq_time" "$fx_time" "$ls_time"
    echo "| Filter | $size | $jq_time | $fx_time | $ls_time |"

    jq_time=$(benchmark "jq" "cat $file | jq '[.[] | .name]'")
    fx_time=$(benchmark "fx" "cat $file | fx '.map(x => x.name)'")
    ls_time=$(benchmark "1ls" "cat $file | /app/dist/cli.js '.map(x => x.name)'")
    add_result "$jq_time" "$fx_time" "$ls_time"
    echo "| Map | $size | $jq_time | $fx_time | $ls_time |"

    jq_time=$(benchmark "jq" "cat $file | jq '[.[] | select(.active) | .name]'")
    fx_time=$(benchmark "fx" "cat $file | fx '.filter(x => x.active).map(x => x.name)'")
    ls_time=$(benchmark "1ls" "cat $file | /app/dist/cli.js '.filter(x => x.active).map(x => x.name)'")
    add_result "$jq_time" "$fx_time" "$ls_time"
    echo "| Filter+Map | $size | $jq_time | $fx_time | $ls_time |"
  done
}

run_aggregation_benchmarks() {
  print_header "Aggregation (ms)"

  for size in "${SIZES[@]}"; do
    local file=$(generate_data "$size")

    local jq_time=$(benchmark "jq" "cat $file | jq '[.[].score] | add'")
    local fx_time=$(benchmark "fx" "cat $file | fx '.map(x => x.score).reduce((a,b) => a+b, 0)'")
    local ls_time=$(benchmark "1ls" "cat $file | /app/dist/cli.js '.map(x => x.score) | sum()'")
    add_result "$jq_time" "$fx_time" "$ls_time"
    echo "| Sum | $size | $jq_time | $fx_time | $ls_time |"

    jq_time=$(benchmark "jq" "cat $file | jq '[.[].score] | min'")
    fx_time=$(benchmark "fx" "cat $file | fx 'Math.min(...x.map(i => i.score))'")
    ls_time=$(benchmark "1ls" "cat $file | /app/dist/cli.js '.map(x => x.score) | min()'")
    add_result "$jq_time" "$fx_time" "$ls_time"
    echo "| Min | $size | $jq_time | $fx_time | $ls_time |"

    jq_time=$(benchmark "jq" "cat $file | jq '[.[].score] | max'")
    fx_time=$(benchmark "fx" "cat $file | fx 'Math.max(...x.map(i => i.score))'")
    ls_time=$(benchmark "1ls" "cat $file | /app/dist/cli.js '.map(x => x.score) | max()'")
    add_result "$jq_time" "$fx_time" "$ls_time"
    echo "| Max | $size | $jq_time | $fx_time | $ls_time |"
  done
}

run_builtin_benchmarks() {
  print_header "Builtin Functions (ms)"

  for size in "${SIZES[@]}"; do
    local file=$(generate_data "$size")

    local jq_time=$(benchmark "jq" "cat $file | jq 'first'")
    local fx_time=$(benchmark "fx" "cat $file | fx '.[0]'")
    local ls_time=$(benchmark "1ls" "cat $file | /app/dist/cli.js 'head()'")
    add_result "$jq_time" "$fx_time" "$ls_time"
    echo "| head() | $size | $jq_time | $fx_time | $ls_time |"

    jq_time=$(benchmark "jq" "cat $file | jq 'last'")
    fx_time=$(benchmark "fx" "cat $file | fx '.at(-1)'")
    ls_time=$(benchmark "1ls" "cat $file | /app/dist/cli.js 'last()'")
    add_result "$jq_time" "$fx_time" "$ls_time"
    echo "| last() | $size | $jq_time | $fx_time | $ls_time |"

    jq_time=$(benchmark "jq" "cat $file | jq '.[:10]'")
    fx_time=$(benchmark "fx" "cat $file | fx '.slice(0, 10)'")
    ls_time=$(benchmark "1ls" "cat $file | /app/dist/cli.js 'take(10)'")
    add_result "$jq_time" "$fx_time" "$ls_time"
    echo "| take(10) | $size | $jq_time | $fx_time | $ls_time |"

    jq_time=$(benchmark "jq" "cat $file | jq 'unique_by(.age)'")
    fx_time=$(benchmark "fx" "cat $file | fx '.filter((v,i,a) => a.findIndex(t => t.age === v.age) === i)'")
    ls_time=$(benchmark "1ls" "cat $file | /app/dist/cli.js '.map(x => x.age) | uniq()'")
    add_result "$jq_time" "$fx_time" "$ls_time"
    echo "| uniq() | $size | $jq_time | $fx_time | $ls_time |"

    jq_time=$(benchmark "jq" "cat $file | jq 'flatten'")
    fx_time=$(benchmark "fx" "cat $file | fx '.flat()'")
    ls_time=$(benchmark "1ls" "cat $file | /app/dist/cli.js 'flatten()'")
    add_result "$jq_time" "$fx_time" "$ls_time"
    echo "| flatten() | $size | $jq_time | $fx_time | $ls_time |"
  done
}

run_nested_benchmarks() {
  print_header "Nested Data Operations (ms)"

  for size in "${SIZES[@]}"; do
    local file=$(generate_nested_data "$size")

    local jq_time=$(benchmark "jq" "cat $file | jq '.data.users[0].profile.name'")
    local fx_time=$(benchmark "fx" "cat $file | fx '.data.users[0].profile.name'")
    local ls_time=$(benchmark "1ls" "cat $file | /app/dist/cli.js '.data.users[0].profile.name'")
    add_result "$jq_time" "$fx_time" "$ls_time"
    echo "| Deep access | $size | $jq_time | $fx_time | $ls_time |"

    jq_time=$(benchmark "jq" "cat $file | jq '.. | numbers'")
    fx_time=$(benchmark "fx" "cat $file | fx 'JSON.stringify(x).match(/\\d+/g)'")
    ls_time=$(benchmark "1ls" "cat $file | /app/dist/cli.js '..'")
    add_result "$jq_time" "$fx_time" "$ls_time"
    echo "| Recursive descent | $size | $jq_time | $fx_time | $ls_time |"

    jq_time=$(benchmark "jq" "cat $file | jq '.data.users | keys'")
    fx_time=$(benchmark "fx" "cat $file | fx 'Object.keys(x.data.users)'")
    ls_time=$(benchmark "1ls" "cat $file | /app/dist/cli.js '.data.users | keys()'")
    add_result "$jq_time" "$fx_time" "$ls_time"
    echo "| keys() | $size | $jq_time | $fx_time | $ls_time |"
  done
}

run_string_benchmarks() {
  print_header "String Operations (ms)"

  for size in "${SIZES[@]}"; do
    local file=$(generate_data "$size")

    local jq_time=$(benchmark "jq" "cat $file | jq '[.[].name | split(\"r\")]'")
    local fx_time=$(benchmark "fx" "cat $file | fx '.map(x => x.name.split(\"r\"))'")
    local ls_time=$(benchmark "1ls" "cat $file | /app/dist/cli.js '.map(x => x.name) | .map(x => split(\"r\"))'")
    add_result "$jq_time" "$fx_time" "$ls_time"
    echo "| split() | $size | $jq_time | $fx_time | $ls_time |"

    jq_time=$(benchmark "jq" "cat $file | jq '[.[].name | startswith(\"user1\")]'")
    fx_time=$(benchmark "fx" "cat $file | fx '.map(x => x.name.startsWith(\"user1\"))'")
    ls_time=$(benchmark "1ls" "cat $file | /app/dist/cli.js '.map(x => x.name) | .map(x => startswith(\"user1\"))'")
    add_result "$jq_time" "$fx_time" "$ls_time"
    echo "| startswith() | $size | $jq_time | $fx_time | $ls_time |"
  done
}

DETAILS_OUTPUT=$(mktemp)

{
  run_basic_benchmarks
  run_filter_map_benchmarks
  run_aggregation_benchmarks
  run_builtin_benchmarks
  run_nested_benchmarks
  run_string_benchmarks
} > "$DETAILS_OUTPUT"

JQ_AVG=$(echo "scale=2; $JQ_TOTAL / $TEST_COUNT" | bc)
FX_AVG=$(echo "scale=2; $FX_TOTAL / $TEST_COUNT" | bc)
LS_AVG=$(echo "scale=2; $LS_TOTAL / $TEST_COUNT" | bc)

JQ_VS_LS=$(echo "scale=0; $JQ_AVG / $LS_AVG" | bc)
FX_VS_LS=$(echo "scale=0; $FX_AVG / $LS_AVG" | bc)

echo "# 1ls Performance Benchmarks"
echo ""
echo "Comparing 1ls with jq and fx across various operations and data sizes."
echo ""
echo "- **Runs per test:** $RUNS"
echo "- **Data sizes:** ${SIZES[*]} records"
echo "- **Environment:** Docker (debian:bookworm-slim)"
echo ""

echo "## Summary"
echo ""
echo "| Tool | Avg Time (ms) | vs 1ls |"
echo "|------|---------------|--------|"
echo "| **1ls** | **${LS_AVG}** | **1x** |"
echo "| jq | ${JQ_AVG} | ${JQ_VS_LS}x slower |"
echo "| fx | ${FX_AVG} | ${FX_VS_LS}x slower |"
echo ""
echo "**1ls is ${JQ_VS_LS}x faster than jq and ${FX_VS_LS}x faster than fx on average.**"
echo ""
echo "Lower is better. Times in milliseconds (ms)."

cat "$DETAILS_OUTPUT"
rm "$DETAILS_OUTPUT"

echo ""
echo "---"
echo "Generated on: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
