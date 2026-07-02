"""Operation solver implementations.

Importing this package imports every solver module, which registers each solver into
``OPERATION_SOLVERS`` via the ``@register`` decorator.
"""

from . import charge  # noqa: F401
from . import transfer  # noqa: F401
from . import pressure_transfer  # noqa: F401
from . import timing  # noqa: F401
from . import heatcool  # noqa: F401
from . import react  # noqa: F401
from . import yield_react  # noqa: F401
from . import crystallize  # noqa: F401
from . import concentrate  # noqa: F401
from . import filter  # noqa: F401
from . import wash_cake  # noqa: F401
from . import centrifuge  # noqa: F401
from . import dry  # noqa: F401
from . import filter_dry  # noqa: F401
from . import distill  # noqa: F401
from . import extract  # noqa: F401
from . import decant  # noqa: F401
from . import ferment  # noqa: F401
