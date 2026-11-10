% The long-lived Octave behind octave-run.js: octave-cli with the control and signal packages costs about 10 s to start,
% so one worker loads them once and then runs each snippet as if pasted alone into a fresh MATLAB: inside a function,
% so its workspace starts empty and is gone afterwards, in its own working folder (a temporary copy made by the
% caller), with nothing shown (figures are invisible). What a snippet can leave behind for the next (open figures, the
% display format, the working folder, global variables) is reset after each.
% Protocol: "@@READY" on stdout once the packages are loaded; then for each JSON request {"file", "cwd",
% "checks"} in <inbox>/request.json (the last argument) a reply "@@" followed by JSON {"ok", "stdout", "stderr", "values"}, where values holds each check
% expression's value in the snippet's workspace. Anything else Octave prints (warnings, gnuplot) is not on a "@@" line.
1;

function reply = run_one__(req__)
  reply = struct("ok", true, "stdout", "", "stderr", "", "values", {{}});
  code__ = fileread(req__.file);
  cd(req__.cwd);
  try
    reply.stdout = evalc(code__);
  catch err__
    reply.ok = false;
    reply.stderr = err__.message;
    return;
  end
  checks__ = req__.checks;
  if ischar(checks__), checks__ = {checks__}; end
  vals__ = cell(1, numel(checks__));
  for k__ = 1:numel(checks__)
    try
      v__ = eval([checks__{k__} ";"]);
      if ! isnumeric(v__) && ! islogical(v__)
        error("not a number but a %s", class(v__));
      end
      if ! isreal(v__)
        error("complex; check the real and imaginary parts apart");
      end
      vals__{k__} = double(v__);
    catch err__
      reply.ok = false;
      reply.stderr = sprintf("check %s: %s", checks__{k__}, err__.message);
      return;
    end
  end
  reply.values = vals__;
end

pkg load control
pkg load signal
graphics_toolkit gnuplot
set(0, "defaultfigurevisible", "off");
more off
home__ = pwd;
printf("@@READY\n");
fflush(stdout);

inbox__ = argv(){end};
while true
  % Octave reads a piped stdin in blocks, so a request waits in the inbox folder instead; the worker stops when the
  % caller removes the folder (or dies and its temporary folder goes).
  if ! isfolder(inbox__), break; end
  req_file__ = fullfile(inbox__, "request.json");
  if ! isfile(req_file__), pause(0.02); continue; end
  text__ = fileread(req_file__);
  delete(req_file__);
  try
    reply__ = run_one__(jsondecode(text__));
  catch err__
    reply__ = struct("ok", false, "stdout", "", "stderr", err__.message, "values", {{}});
  end
  close all hidden
  format
  clear -global
  cd(home__);
  % A matrix keeps its rows in JSON ([[1,2],[3,4]]); a scalar is a number; NaN becomes null and fails its check.
  printf("@@%s\n", jsonencode(reply__));
  fflush(stdout);
end
